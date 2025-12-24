import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StaffQueueComponent } from './features/staff-queue/staff-queue.component';
import { MyTasksComponent } from './features/my-tasks/my-tasks.component';
import { WorkCalendarComponent } from './features/work-calendar/work-calendar.component';
import { AssignmentComponent } from './features/assignment/assignment.component';
import { QueueSummaryComponent } from './features/queue-summary/queue-summary.component';
import { ReportsComponent } from './features/reports/reports.component';
import { EmployeesComponent } from './features/employees/employees.component';
import { ScheduleComponent } from './features/schedule/schedule.component';
import { CategoriesComponent } from './features/categories/categories.component';
import { HolidaysComponent } from './features/holidays/holidays.component';
import { LeavesComponent } from './features/leaves/leaves.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'staff-queue', component: StaffQueueComponent, canActivate: [authGuard] },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [authGuard] },
  { path: 'work-calendar', component: WorkCalendarComponent, canActivate: [authGuard] },
  { path: 'assignment', component: AssignmentComponent, canActivate: [authGuard] },
  { path: 'queue', component: QueueSummaryComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: 'employees', component: EmployeesComponent, canActivate: [authGuard] },
  { path: 'schedule', component: ScheduleComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'holidays', component: HolidaysComponent, canActivate: [authGuard] },
  { path: 'leaves', component: LeavesComponent, canActivate: [authGuard] },
];

