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
import { SalesReasonManagementComponent } from './features/sales-reason-management/sales-reason-management.component';
import { MyAccountComponent } from './features/my-account/my-account.component';
import { MyAccountLayoutComponent } from './features/my-account/my-account-layout.component';
import { authGuard } from './guards/auth.guard';
import { managerGuard } from './guards/manager.guard';
import { adminGuard } from './guards/admin.guard';
import { basicOnlyGuard } from './guards/basic-only.guard';
import { superAdminGuard } from './guards/superadmin.guard';
import { SetPasswordPage } from './features/auth-set-password/set-password.page';
import { SalesReportAdminComponent } from './features/sales-report-admin/sales-report-admin.component';
import { HomeRedirectComponent } from './features/home-redirect/home-redirect.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/set-password', component: SetPasswordPage },
  { path: 'auth/set-password/:token', component: SetPasswordPage },
  { path: '', component: HomeRedirectComponent, canActivate: [authGuard] },
  {
    path: 'monitor',
    loadComponent: () => import('./features/monitor/monitor.component').then(m => m.MonitorComponent),
    canActivate: [adminGuard]
  },
  { path: 'my-tasks', component: MyTasksComponent, canActivate: [basicOnlyGuard] },
  { path: 'customer-queue', component: CustomerQueueComponent, canActivate: [basicOnlyGuard] },
  { path: 'calendar', component: WorkCalendarComponent, canActivate: [authGuard] },
  { path: 'assign', component: JobAssignmentComponent, canActivate: [adminGuard] },
  { path: 'summary', component: QueueSummaryComponent, canActivate: [authGuard] },
  { path: 'report', component: SalesReportComponent, canActivate: [basicOnlyGuard] },
  { path: 'sales-report-admin', component: SalesReportAdminComponent, canActivate: [adminGuard] },
  { path: 'settings/employees', component: EmployeeManagementComponent, canActivate: [adminGuard] },
  { path: 'settings/queue', component: QueueSettingsComponent, canActivate: [adminGuard] },
  { path: 'settings/product-categories', component: ProductCategoryManagementComponent, canActivate: [superAdminGuard] },
  { path: 'settings/users', redirectTo: '/settings/employees', pathMatch: 'full' },
  { path: 'settings/sales-reasons', component: SalesReasonManagementComponent, canActivate: [superAdminGuard] },
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
  {
    path: 'manager/employee-status-history',
    loadComponent: () =>
      import('./features/employee-status-history/employee-status-history.component').then(
        m => m.EmployeeStatusHistoryComponent
      ),
    canActivate: [adminGuard]
  },
  {
    path: 'manager/employee-status-audit',
    loadComponent: () =>
      import('./features/employee-status-audit/employee-status-audit-list.component').then(
        m => m.EmployeeStatusAuditListComponent
      ),
    canActivate: [adminGuard]
  },
  {
    path: 'manager/employee-status-audit/:employeeId',
    loadComponent: () =>
      import('./features/employee-status-audit/employee-status-audit-detail.component').then(
        m => m.EmployeeStatusAuditDetailComponent
      ),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '' }
];

