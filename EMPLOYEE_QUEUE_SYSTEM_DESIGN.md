# Employee Queue System - Round-Robin Design Document

## 1. Database Schema

### Existing Table: `Queues`
```sql
CREATE TABLE Queues (
    Id UUID PRIMARY KEY,
    EmployeeId UUID NOT NULL,
    Position INT NOT NULL,  -- Master Queue Order (1..N, changes on rotation)
    Status INT NOT NULL,     -- 1=Active, 2=Inactive, 3=Busy
    QueueDate DATE NOT NULL,
    CreatedDate TIMESTAMP,
    UpdatedDate TIMESTAMP,
    IsDeleted BOOLEAN
);
```

**Key Points:**
- `Position` is mutable - rotates when staff accepts job
- `Status` determines visibility in Ready Queue
- `QueueDate` allows daily queue management

### New Table: `WaitingJobs` (for jobs waiting for Available staff)
```sql
CREATE TABLE WaitingJobs (
    Id UUID PRIMARY KEY,
    JobId UUID NOT NULL,     -- Reference to Job
    CustomerName VARCHAR(255),
    Title VARCHAR(255),
    Priority INT,
    CreatedDate TIMESTAMP,
    AssignedDate TIMESTAMP,   -- When staff becomes available
    IsDeleted BOOLEAN
);
```

## 2. API Endpoints

### Queue Management
- `GET /api/v1/queue/date/{date}` - Get all queues for date (Master Queue)
- `GET /api/v1/queue/dashboard/{date}` - Get dashboard data (Ready/Busy/Unavailable + Summary)
- `PUT /api/v1/queue/rotate` - Rotate queue (move staff to tail) - Internal use
- `PUT /api/v1/queue/my-status` - Update my queue status (Available/Busy/Unavailable)

### Job Management
- `POST /api/v1/job` - Create job (auto-assigns to first Available, or queues if none)
- `PUT /api/v1/job/{id}/status` - Update job status (triggers rotation on InProgress)
- `GET /api/v1/job/waiting` - Get waiting jobs

## 3. Core Algorithms (Pseudocode)

### A) Select Next Available Staff
```
FUNCTION GetNextAvailableStaff(date):
    queues = GetQueuesByDate(date) WHERE Status = Active
    SORT queues BY Position ASC
    RETURN queues[0]  // First Available in Master Queue order
END
```

### B) Rotate Queue on Job Accept
```
FUNCTION RotateQueueToTail(employeeId, date):
    allQueues = GetQueuesByDate(date) WHERE NOT IsDeleted
    SORT allQueues BY Position ASC
    
    staffQueue = FIND queue WHERE EmployeeId = employeeId
    IF staffQueue IS NULL:
        RETURN ERROR
    
    currentPosition = staffQueue.Position
    maxPosition = MAX(allQueues.Position)
    
    // Move all staff after this position up by 1
    FOR EACH queue IN allQueues:
        IF queue.Position > currentPosition:
            queue.Position = queue.Position - 1
            UPDATE queue
    
    // Move accepted staff to tail
    staffQueue.Position = maxPosition
    UPDATE staffQueue
    
    // Use transaction to ensure atomicity
    COMMIT TRANSACTION
END
```

### C) Update on Job Complete
```
FUNCTION OnJobComplete(jobId):
    job = GetJob(jobId)
    employeeId = job.AssigneeId
    
    // Check if employee has other InProgress jobs
    otherInProgress = GetJobs(employeeId) WHERE Status = InProgress AND Id != jobId
    IF otherInProgress.Count == 0:
        queue = GetQueue(employeeId, today)
        queue.Status = Active  // Available
        UPDATE queue
        // Position stays at tail (already rotated)
    END
    
    // Check waiting jobs and assign if staff available
    waitingJobs = GetWaitingJobs()
    IF waitingJobs.Count > 0:
        availableStaff = GetNextAvailableStaff(today)
        IF availableStaff IS NOT NULL:
            nextJob = waitingJobs[0]  // FIFO
            ASSIGN nextJob TO availableStaff
            REMOVE nextJob FROM waitingJobs
        END
    END
END
```

### D) Update on Unavailable → Available
```
FUNCTION OnStatusChangeToAvailable(employeeId, date):
    queue = GetQueue(employeeId, date)
    queue.Status = Active
    UPDATE queue
    // Position remains unchanged (already in Master Queue)
    // Ready Queue will automatically show them at their position
END
```

## 4. UI State Model (Frontend)

```typescript
interface QueueDashboardState {
  // Summary
  completedToday: number;
  busyCount: number;
  availableCount: number;
  waitingJobsCount: number;
  
  // Ready Queue (Available staff, sorted by Master Position)
  readyQueue: ReadyQueueStaff[];
  
  // Busy Staff
  busyStaff: BusyStaff[];
  
  // Unavailable Staff
  unavailableStaff: UnavailableStaff[];
  
  // Waiting Jobs
  waitingJobs: WaitingJob[];
  
  // Real-time indicators
  lastUpdated: Date;
  isLive: boolean;
}

interface ReadyQueueStaff {
  employeeId: string;
  name: string;
  position: number;  // Master Queue Position
  relativePosition: number;  // Position in Ready Queue (1, 2, 3...)
  isNext: boolean;  // First in Ready Queue
  servedToday: number;
}

interface WaitingJob {
  id: string;
  jobId: string;
  customerName: string;
  title: string;
  priority: 'Urgent' | 'Normal' | 'Low';
  createdAt: Date;
}
```

## 5. Edge Cases & Solutions

### Case 1: No Available Staff
- **Solution**: Create WaitingJob entry, display in UI
- **When staff becomes Available**: Auto-assign first waiting job (FIFO)

### Case 2: Concurrent Job Accepts
- **Solution**: Use database transaction with row-level locking
- **Implementation**: Lock queue rows during rotation, use optimistic concurrency

### Case 3: Staff Removed from Queue
- **Solution**: When staff deleted, renumber remaining positions (1..N-1)
- **Implementation**: Bulk update positions after deletion

### Case 4: Multiple Jobs for Same Staff
- **Solution**: Staff stays Busy until ALL jobs completed
- **Implementation**: Check all InProgress jobs before setting to Available

### Case 5: Staff Accepts Job While Unavailable
- **Solution**: Prevent - only Available staff can accept
- **Implementation**: Validate status before assignment

## 6. Thread Safety (Concurrency)

### Database Level
- Use transactions for rotation operations
- Use row-level locks (SELECT FOR UPDATE) when reading queue for rotation
- Use optimistic concurrency (check UpdatedDate) to detect conflicts

### Application Level
- Single rotation operation per transaction
- Retry logic for concurrent conflicts
- Queue position updates are atomic

## 7. Implementation Priority

1. ✅ Add rotation method to QueueRepository
2. ✅ Update UpdateStatusHandler to rotate on InProgress
3. ✅ Create WaitingJob entity and repository
4. ✅ Update CreateHandler to handle waiting jobs
5. ✅ Add waiting jobs API endpoint
6. ✅ Update frontend to show waiting jobs
7. ✅ Add real-time updates for waiting jobs

