import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private productCategoryService: ProductCategoryService,
    private salesReasonService: SalesReasonService,
    private cdr: ChangeDetectorRef
  ) {
    const requireAtLeastOne = (): ValidatorFn => {
      return (control: AbstractControl): { [key: string]: any } | null => {
        const formGroup = control as FormGroup;
        if (!formGroup) {
          return null;
        }
        const hasSelection = Object.keys(formGroup.controls).some(key => formGroup.controls[key].value);
        return hasSelection ? null : { requireAtLeastOne: true };
      };
    };

    this.salesReportForm = this.fb.group({
      customerName: ['', Validators.required],
      contactInfo: [''],
      status: ['Success' as ReportStatus, Validators.required],
      reasons: this.fb.group({}, { validators: requireAtLeastOne() }),
      interestedProducts: this.fb.group({}, { validators: requireAtLeastOne() }),
      additionalInfo: [''],
      saleValue: [0],
      invoiceId: ['']
    });
  }

  selectedStatus = signal<ReportStatus>('Success');

  ngOnInit(): void {
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
      this.interestedProductsList.set(response.productCategories);
      this.isLoadingCategories.set(false);
      
      // Dynamically create form controls for each category
      const productsForm = this.salesReportForm.get('interestedProducts') as FormGroup;
      response.productCategories.forEach(category => {
        if (!productsForm.get(category.id)) {
          productsForm.addControl(category.id, this.fb.control(false));
        }
      });
      
      // If we have report data, set the form values now
      if (this.report) {
        this.setInterestedProductsFromReport(this.report);
      }
      
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
      this.pendingReasons.set((pending.reasons || []).filter(r => r.isActive));
      this.failedReasons.set((failed.reasons || []).filter(r => r.isActive));
      this.rebuildReasonControls();
      this.trySetReasonsFromReport();
    });
  }

  private rebuildReasonControls(): void {
    const reasonsForm = this.salesReportForm.get('reasons') as FormGroup;
    const all = [...this.pendingReasons(), ...this.failedReasons()];

    all.forEach(reason => {
      if (!reasonsForm.get(reason.id)) {
        reasonsForm.addControl(reason.id, this.fb.control(false));
      }
    });
  }

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
    const productControls = (this.salesReportForm.get('interestedProducts') as FormGroup).controls;
    
    // Clear existing controls
    Object.keys(productControls).forEach(key => {
      productControls[key].setValue(false);
    });
    
    // Set values for products that match by name (backend stores as comma-separated names)
    reportData.interestedProducts.forEach((productName: string) => {
      const product = this.interestedProductsList().find(p => p.name === productName.trim());
      if (product && productControls[product.id]) {
        productControls[product.id].setValue(true);
      }
    });
  }

  setStatus(status: ReportStatus) {
    this.selectedStatus.set(status);
    this.salesReportForm.controls['status'].setValue(status);
    
    const reasonsControl = this.salesReportForm.get('reasons');
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
  }

  onConfirmSave() {
    this.salesReportForm.markAllAsTouched();
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
