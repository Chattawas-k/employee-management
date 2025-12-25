import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '../../environments/environment';
import { JobStatus, JobPriority } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMyTasks', () => {
    it('should fetch tasks successfully', () => {
      const mockResponse = {
        jobs: [
          {
            id: '1',
            title: 'Test Job',
            customer: 'Test Customer',
            description: 'Test Description',
            assigneeId: 'emp-1',
            status: JobStatus.Pending,
            priority: JobPriority.Normal,
            createdDate: new Date().toISOString(),
            statusLogs: []
          }
        ]
      };

      service.getMyTasks().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.jobs.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/job/my-tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createJob', () => {
    it('should create a job successfully', () => {
      const mockRequest = {
        title: 'New Job',
        customer: 'New Customer',
        description: 'New Description',
        assigneeId: 'emp-1',
        priority: JobPriority.Normal
      };

      const mockResponse = {
        id: 'new-id',
        ...mockRequest,
        status: JobStatus.Pending,
        createdDate: new Date().toISOString()
      };

      service.createJob(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/job`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});

