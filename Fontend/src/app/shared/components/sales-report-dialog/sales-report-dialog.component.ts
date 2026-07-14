import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Task } from '../task-column/task-column.component';
import { SalesReport, ReportStatus } from '../../../models/sales-report.model';
import { ProductCategoryService } from '../../../services/product-category.service';
import { ProductCategoryDropdownDto } from '../../../models/product-category.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SalesReasonService } from '../../../services/sales-reason.service';
import { SalesReasonDto } from '../../../models/sales-reason.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sales-report-dialog',
  standalone: true,
  templateUrl: './sales-report-dialog.component.html',
  styleUrls: ['./sales-report-dialog.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReportDialogComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() report: SalesReport | null = null;
  @Input() initialStatus: ReportStatus | null = null;

  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  pendingReasons = signal<SalesReasonDto[]>([]);
  failedReasons = signal<SalesReasonDto[]>([]);
  isLoadingReasons = signal(false);

  interestedProductsList = signal<ProductCategoryDropdownDto[]>([]);
  isLoadingCategories = signal(false);

  salesReportForm!: ReturnType<FormBuilder['group']>;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private productCategoryService: ProductCategoryService,
    private salesReasonService: SalesReasonService,
    private cdr: ChangeDetectorRef
  ) {
    this.salesReportForm = this.fb.group({
      customerName: ['', Validators.required],
      contactInfo: [''],
      status: ['Success' as ReportStatus, Validators.required],
      // Status-specific validation is handled in setStatus():
      // - Success  => interestedProducts required, reasons disabled
      // - Pending/Failed => reasons required, interestedProducts optional
      reasons: this.fb.group({}, { validators: this.requireAtLeastOne() }),
      interestedProducts: this.fb.group({}, { validators: this.requireAtLeastOne() }),
      additionalInfo: [''],
      saleValue: [0],
      saleDate: [''],
      invoiceId: ['']
    });

    this.setStatus('Success');
  }

  selectedStatus = signal<ReportStatus>('Success');

  ngOnInit(): void {
    // With OnPush + reactive forms, we need to manually mark for check when validity changes,
    // otherwise bindings like [disabled]="salesReportForm.invalid" may not refresh.
    this.salesReportForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
    this.salesReportForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    this.loadProductCategories();
    this.loadSalesReasons();
    const reportData = this.report;
    const taskData = this.task;
    
    if (reportData) {
      this.salesReportForm.patchValue({
        customerName: reportData.customerName,
        contactInfo: reportData.contactInfo,
        status: reportData.status,
        additionalInfo: reportData.notes || '',
        saleValue: reportData.saleValue || 0,
        saleDate: this.toDateInputValue(reportData.saleDate),
        invoiceId: reportData.invoiceId || ''
      });

      // Wait for categories to load before setting form values
      if (this.interestedProductsList().length > 0) {
        this.setInterestedProductsFromReport(reportData);
      } else {
        // If categories haven't loaded yet, wait a bit and try again
        setTimeout(() => {
          this.setInterestedProductsFromReport(reportData);
        }, 500);
      }
      
      this.setStatus(this.initialStatus || reportData.status);
    } else if (taskData) {
      this.salesReportForm.patchValue({
        customerName: taskData.customerName || '',
        contactInfo: ''
      });
      this.setStatus('Success');
    } else {
      this.setStatus('Success');
    }
  }

  loadProductCategories(): void {
    this.isLoadingCategories.set(true);
    this.productCategoryService.getDropdownList().pipe(
      catchError(error => {
        console.error('Error loading product categories:', error);
        return of({ productCategories: [] });
      })
    ).subscribe(response => {
      // IMPORTANT: Create form controls BEFORE updating the UI list.
      // Otherwise the template may render checkboxes whose formControlName doesn't exist yet,
      // causing the checkbox state not to bind to the reactive form (form stays invalid).
      const productsForm = this.salesReportForm.get('interestedProducts') as FormGroup;
      (response.productCategories || []).forEach(category => {
        if (!productsForm.get(category.id)) {
          productsForm.addControl(category.id, this.fb.control(false));
        }
      });
      productsForm.updateValueAndValidity({ emitEvent: false });

      this.interestedProductsList.set(response.productCategories || []);
      this.isLoadingCategories.set(false);
      
      // If we have report data, set the form values now
      if (this.report) {
        this.setInterestedProductsFromReport(this.report);
      }

      // Re-apply status rules after dynamic controls exist
      this.setStatus(this.selectedStatus());
      
      this.cdr.markForCheck();
    });
  }

  loadSalesReasons(): void {
    this.isLoadingReasons.set(true);
    forkJoin({
      pending: this.salesReasonService.getByType('pendingDecision', false).pipe(
        catchError(error => {
          console.error('Error loading pending reasons:', error);
          return of({ reasons: [] as SalesReasonDto[] });
        })
      ),
      failed: this.salesReasonService.getByType('failedClose', false).pipe(
        catchError(error => {
          console.error('Error loading failed reasons:', error);
          return of({ reasons: [] as SalesReasonDto[] });
        })
      )
    }).pipe(
      finalize(() => {
        this.isLoadingReasons.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(({ pending, failed }) => {
      const pendingActive = (pending.reasons || []).filter(r => r.isActive);
      const failedActive = (failed.reasons || []).filter(r => r.isActive);

      // IMPORTANT: Create controls BEFORE updating reason lists used by the template.
      const reasonsForm = this.salesReportForm.get('reasons') as FormGroup;
      [...pendingActive, ...failedActive].forEach(reason => {
        if (!reasonsForm.get(reason.id)) {
          reasonsForm.addControl(reason.id, this.fb.control(false));
        }
      });
      reasonsForm.updateValueAndValidity({ emitEvent: false });

      this.pendingReasons.set(pendingActive);
      this.failedReasons.set(failedActive);
      this.trySetReasonsFromReport();

      // Re-apply status rules after dynamic controls exist
      this.setStatus(this.selectedStatus());
    });
  }

  // NOTE: reason controls are now created directly in loadSalesReasons()

  private trySetReasonsFromReport(): void {
    if (!this.report) return;
    const reasonsForm = this.salesReportForm.get('reasons') as FormGroup;
    const all = [...this.pendingReasons(), ...this.failedReasons()];
    if (all.length === 0 || Object.keys(reasonsForm.controls).length === 0) return;

    // Clear first
    Object.keys(reasonsForm.controls).forEach(key => reasonsForm.controls[key].setValue(false, { emitEvent: false }));

    // Existing reports store labels; match by label
    const labels = this.report.reasons || [];
    labels.forEach(label => {
      const match = all.find(r => r.label === label);
      if (match && reasonsForm.get(match.id)) {
        reasonsForm.get(match.id)?.setValue(true, { emitEvent: false });
      }
    });
  }

  private setInterestedProductsFromReport(reportData: SalesReport): void {
    const productsGroup = this.salesReportForm.get('interestedProducts') as FormGroup;
    const productControls = productsGroup.controls;
    
    // Clear existing controls
    Object.keys(productControls).forEach(key => {
      productControls[key].setValue(false, { emitEvent: false });
    });
    
    // Set values for products that match by name (backend stores as comma-separated names)
    reportData.interestedProducts.forEach((productName: string) => {
      const product = this.interestedProductsList().find(p => p.name === productName.trim());
      if (product && productControls[product.id]) {
        productControls[product.id].setValue(true, { emitEvent: false });
      }
    });

    productsGroup.updateValueAndValidity({ emitEvent: false });
    this.salesReportForm.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  setStatus(status: ReportStatus) {
    this.selectedStatus.set(status);
    this.salesReportForm.controls['status'].setValue(status, { emitEvent: false });
    
    const reasonsControl = this.salesReportForm.get('reasons');
    const interestedProductsControl = this.salesReportForm.get('interestedProducts');

    // Dynamic requirements:
    // - Success: require at least 1 interested product, reasons not required
    // - Pending/Failed: require at least 1 reason, interested products optional
    if (status === 'Success') {
      interestedProductsControl?.setValidators(this.requireAtLeastOne());
    } else {
      interestedProductsControl?.clearValidators();
    }
    interestedProductsControl?.updateValueAndValidity({ emitEvent: false });

    if (status === 'Success') {
      reasonsControl?.disable();
      reasonsControl?.reset(); 
    } else {
      reasonsControl?.enable();

      // Prevent hidden selections from satisfying validation
      const reasonsForm = reasonsControl as FormGroup;
      if (status === 'Pending') {
        this.failedReasons().forEach(r => reasonsForm.get(r.id)?.setValue(false));
      }
      if (status === 'Failed') {
        this.pendingReasons().forEach(r => reasonsForm.get(r.id)?.setValue(false));
      }
    }

    reasonsControl?.updateValueAndValidity({ emitEvent: false });
    this.salesReportForm.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onConfirmSave() {
    this.salesReportForm.markAllAsTouched();
    this.cdr.markForCheck();
    if (this.salesReportForm.valid) {
      const formValue = this.salesReportForm.getRawValue();
      
      // Convert selected category IDs to category names (comma-separated string)
      const selectedCategoryIds = Object.keys(formValue.interestedProducts || {})
        .filter(key => formValue.interestedProducts[key] === true);
      
      const selectedCategoryNames = selectedCategoryIds
        .map(id => {
          const category = this.interestedProductsList().find(c => c.id === id);
          return category?.name || '';
        })
        .filter(name => name.length > 0);
      
      // Replace interestedProducts object with array of names for backward compatibility
      const selectedReasonIds = this.getSelectedReasonIdsByStatus(formValue.status as ReportStatus, formValue.reasons || {});
      const selectedReasonLabels = this.getReasonLabelsFromIds(selectedReasonIds);

      const transformedValue = {
        ...formValue,
        interestedProducts: selectedCategoryNames,
        interestedProductIds: selectedCategoryIds, // Keep IDs for future use
        reasonIds: selectedReasonIds,
        reasons: selectedReasonLabels
      };
      
      this.save.emit(transformedValue);
    }
  }

  private getSelectedReasonIdsByStatus(status: ReportStatus, reasonsMap: Record<string, boolean>): string[] {
    if (status === 'Success') return [];

    const list: SalesReasonDto[] =
      status === 'Pending' ? this.pendingReasons() :
      status === 'Failed' ? this.failedReasons() :
      [];

    return list
      .filter(r => reasonsMap[r.id] === true)
      .map(r => r.id);
  }

  private getReasonLabelsFromIds(ids: string[]): string[] {
    const all = [...this.pendingReasons(), ...this.failedReasons()];
    return ids
      .map(id => all.find(r => r.id === id)?.label)
      .filter((x): x is string => !!x);
  }

  /** Format a Date to the yyyy-MM-dd value expected by <input type="date">. */
  private toDateInputValue(date?: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private requireAtLeastOne(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const formGroup = control as FormGroup;
        if (!formGroup) {
            return null;
        }
        const hasSelection = Object.keys(formGroup.controls).some(key => formGroup.controls[key].value);
        return hasSelection ? null : { requireAtLeastOne: true };
    };
  }
}
