import { Routes } from '@angular/router';
import { MyTasksComponent } from './features/my-tasks/my-tasks.component';
import { CustomerQueueComponent } from './features/customer-queue/customer-queue.component';
import { JobAssignmentComponent } from './features/job-assignment/job-assignment.component';
import { SalesReportComponent } from './features/sales-report/sales-report.component';
import { WorkCalendarComponent } from './features/work-calendar/work-calendar.component';
import { QueueSummaryComponent } from './features/queue-summary/queue-summary.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/my-tasks', pathMatch: 'full' },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [authGuard] },
  { path: 'customer-queue', component: CustomerQueueComponent, canActivate: [authGuard] },
  { path: 'calendar', component: WorkCalendarComponent, canActivate: [authGuard] },
  { path: 'assign', component: JobAssignmentComponent, canActivate: [authGuard] },
  { path: 'summary', component: QueueSummaryComponent, canActivate: [authGuard] },
  { path: 'report', component: SalesReportComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/my-tasks' }
];

