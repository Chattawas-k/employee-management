import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Schedule, Holiday, Leave } from '../../models/schedule.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { formatDateThaiFull } from '../../utils/date.utils';

interface CalendarDay {
  date: number;
  fullDate: string;
  holiday: Holiday | null;
  workingStaff: Employee[];
  key: string;
  type: 'day' | 'pad';
}

interface DayDetails {
  date: string;
  isHoliday: boolean;
  holidayName: string | null;
  staffStatus: Array<{
    id: string;
    name: string;
    avatar: string;
    currentDayStatus: 'Available' | 'Inactive' | 'Leave';
    leaveReason?: string;
  }>;
}

@Component({
  selector: 'app-work-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    IconComponent
  ],
  templateUrl: './work-calendar.component.html',
  styleUrls: ['./work-calendar.component.scss']
})
export class WorkCalendarComponent implements OnInit {
  employees = signal<Employee[]>([]);
  schedules = signal<Schedule[]>([]);
  holidays = signal<Holiday[]>([]);
  leaves = signal<Leave[]>([]);
  currentDate = signal(new Date());
  isDayDetailOpen = signal(false);
  selectedDayDetails = signal<DayDetails | null>(null);

  monthNamesThai = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.employees$.subscribe(emps => this.employees.set(emps));
    this.dataService.schedules$.subscribe(scheds => this.schedules.set(scheds));
    this.dataService.holidays$.subscribe(hols => this.holidays.set(hols));
    this.dataService.leaves$.subscribe(levs => this.leaves.set(levs));
  }

  nextMonth(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() + 1);
    this.currentDate.set(date);
  }

  prevMonth(): void {
    const date = new Date(this.currentDate());
    date.setMonth(date.getMonth() - 1);
    this.currentDate.set(date);
  }

  generateCalendarDays(): CalendarDay[] {
    const days: CalendarDay[] = [];
    const date = new Date(this.currentDate());
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    
    // Add padding days
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: 0,
        fullDate: '',
        holiday: null,
        workingStaff: [],
        key: `pad-${i}`,
        type: 'pad'
      });
    }
    
    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      // Find holiday
      const holiday = this.holidays().find(h => h.date === dateStr) || null;
      
      // Find working staff (based on schedule)
      const workingStaff: Employee[] = [];
      this.employees().forEach(emp => {
        if (emp.status === 'Inactive') return;
        
        const schedule = this.schedules().find(s => s.empId === emp.id);
        const dayOfWeek = dayDate.getDay();
        const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek] as keyof Schedule;
        
        if (schedule && schedule[dayKey] === 'Available') {
          // Check if employee is on leave
          const isOnLeave = this.leaves().some(l => l.empId === emp.id && l.date === dateStr);
          if (!isOnLeave) {
            workingStaff.push(emp);
          }
        }
      });
      
      days.push({
        date: i,
        fullDate: dateStr,
        holiday,
        workingStaff,
        key: dateStr,
        type: 'day'
      });
    }
    
    return days;
  }

  calendarDays = computed(() => this.generateCalendarDays());

  handleDayClick(day: CalendarDay): void {
    if (day.type === 'pad') return;
    
    const staffStatus = this.employees().map(emp => {
      const isOnLeave = this.leaves().some(l => l.empId === emp.id && l.date === day.fullDate);
      const leave = this.leaves().find(l => l.empId === emp.id && l.date === day.fullDate);
      
      if (isOnLeave) {
        return {
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar || '',
          currentDayStatus: 'Leave' as const,
          leaveReason: leave?.reason
        };
      }
      
      const schedule = this.schedules().find(s => s.empId === emp.id);
      const dayDate = new Date(day.fullDate);
      const dayOfWeek = dayDate.getDay();
      const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek] as keyof Schedule;
      
      if (emp.status === 'Inactive') {
        return {
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar || '',
          currentDayStatus: 'Inactive' as const
        };
      }
      
      if (schedule && schedule[dayKey] === 'Available') {
        return {
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar || '',
          currentDayStatus: 'Available' as const
        };
      }
      
      return {
        id: emp.id,
        name: emp.name,
        avatar: emp.avatar || '',
        currentDayStatus: 'Inactive' as const
      };
    });
    
    this.selectedDayDetails.set({
      date: day.fullDate,
      isHoliday: !!day.holiday,
      holidayName: day.holiday?.name || null,
      staffStatus
    });
    
    this.isDayDetailOpen.set(true);
  }

  closeDayDetail(): void {
    this.isDayDetailOpen.set(false);
  }

  getWorkingStaff(): Array<{id: string; name: string; avatar: string; currentDayStatus: 'Available' | 'Inactive' | 'Leave'; leaveReason?: string}> {
    const details = this.selectedDayDetails();
    if (!details) return [];
    return details.staffStatus.filter(s => s.currentDayStatus !== 'Inactive' && s.currentDayStatus !== 'Leave');
  }

  getNonWorkingStaff(): Array<{id: string; name: string; avatar: string; currentDayStatus: 'Available' | 'Inactive' | 'Leave'; leaveReason?: string}> {
    const details = this.selectedDayDetails();
    if (!details) return [];
    return details.staffStatus.filter(s => s.currentDayStatus === 'Inactive' || s.currentDayStatus === 'Leave');
  }

  formatDateThaiFull(dateString: string | null | undefined): string {
    return formatDateThaiFull(dateString);
  }
}
