import { Routes } from '@angular/router';
import { MyTasksComponent } from './features/my-tasks/my-tasks.component';
import { CustomerQueueComponent } from './features/customer-queue/customer-queue.component';
import { JobAssignmentComponent } from './features/job-assignment/job-assignment.component';
import { SalesReportComponent } from './features/sales-report/sales-report.component';
import { WorkCalendarComponent } from './features/work-calendar/work-calendar.component';
import { QueueSummaryComponent } from './features/queue-summary/queue-summary.component';
import { LoginComponent } from './features/login/login.component';
import { EmployeeManagementComponent } from './features/employee-management/employee-management.component';
import { QueueSettingsComponent } from './features/queue-settings/queue-settings.component';
import { ProductCategoryManagementComponent } from './features/product-category-management/product-category-management.component';
import { UsersPermissionsComponent } from './features/users-permissions/users-permissions.component';
import { MyAccountComponent } from './features/my-account/my-account.component';
import { MyAccountLayoutComponent } from './features/my-account/my-account-layout.component';
import { authGuard } from './guards/auth.guard';
import { managerGuard } from './guards/manager.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/my-tasks', pathMatch: 'full' },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [authGuard] },
  { path: 'customer-queue', component: CustomerQueueComponent, canActivate: [authGuard] },
  { path: 'calendar', component: WorkCalendarComponent, canActivate: [authGuard] },
  { path: 'assign', component: JobAssignmentComponent, canActivate: [authGuard] },
  { path: 'summary', component: QueueSummaryComponent, canActivate: [authGuard] },
  { path: 'report', component: SalesReportComponent, canActivate: [authGuard] },
  { path: 'settings/employees', component: EmployeeManagementComponent, canActivate: [authGuard] },
  { path: 'settings/queue', component: QueueSettingsComponent, canActivate: [authGuard] },
  { path: 'settings/product-categories', component: ProductCategoryManagementComponent, canActivate: [authGuard] },
  { path: 'settings/users', component: UsersPermissionsComponent, canActivate: [authGuard] },
  {
    path: 'my-account',
    component: MyAccountLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: MyAccountComponent },
      {
        path: 'job-status-history',
        loadComponent: () =>
          import('./features/job-status-history/job-status-history.component').then(
            m => m.JobStatusHistoryComponent
          )
      }
    ]
  },
  // Manager routes
  { 
    path: 'manager/dashboard', 
    loadComponent: () => import('./features/manager-dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/queue', 
    loadComponent: () => import('./features/manager-live-queue/manager-live-queue.component').then(m => m.ManagerLiveQueueComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/staff', 
    loadComponent: () => import('./features/manager-staff-overview/manager-staff-overview.component').then(m => m.ManagerStaffOverviewComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/deals', 
    loadComponent: () => import('./features/manager-deals-sales/manager-deals-sales.component').then(m => m.ManagerDealsSalesComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/reports', 
    loadComponent: () => import('./features/manager-reports/manager-reports.component').then(m => m.ManagerReportsComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/audit', 
    loadComponent: () => import('./features/manager-audit-log/manager-audit-log.component').then(m => m.ManagerAuditLogComponent),
    canActivate: [managerGuard] 
  },
  { 
    path: 'manager/settings', 
    loadComponent: () => import('./features/manager-settings/manager-settings.component').then(m => m.ManagerSettingsComponent),
    canActivate: [managerGuard] 
  },
  { path: '**', redirectTo: '/my-tasks' }
];

