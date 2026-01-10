import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Task } from '../task-column/task-column.component';
import { SalesReport, ReportStatus } from '../../../models/sales-report.model';
import { ProductCategoryService } from '../../../services/product-category.service';
import { ProductCategoryDropdownDto } from '../../../models/product-category.model';
import { catchError, of } from 'rxjs';

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

  pendingReasons = [
    { controlName: 'wantsToDecide', label: 'ขอไปตัดสินใจก่อน' },
    { controlName: 'waitingForPromo', label: 'รอโปรโมชั่น' },
    { controlName: 'comparing', label: 'เปรียบเทียบกับที่อื่น' },
    { controlName: 'consultingFamily', label: 'ปรึกษาครอบครัว/เพื่อน' },
    { controlName: 'needsMoreInfo', label: 'ต้องการข้อมูลเพิ่มเติม' },
    { controlName: 'waitingForStock', label: 'รอสินค้าเข้า' },
    { controlName: 'financialApproval', label: 'รออนุมัติทางการเงิน' },
    { controlName: 'undecidedOnSpec', label: 'ยังไม่แน่ใจเรื่องสี/ขนาด' },
    { controlName: 'seasonalTiming', label: 'รอฤกษ์/ช่วงเวลาที่เหมาะสม' },
    { controlName: 'wantsToSeeSample', label: 'ต้องการดูสินค้าตัวอย่าง' }
  ];

  failedReasons = [
    { controlName: 'priceTooHigh', label: 'ราคาสูงไป' },
    { controlName: 'productMismatch', label: 'สินค้าไม่ตรงความต้องการ' },
    { controlName: 'badService', label: 'ไม่พอใจบริการ' },
    { controlName: 'foundCheaper', label: 'เจอที่อื่นถูกกว่า' },
    { controlName: 'longDelivery', label: 'ระยะเวลาจัดส่งนานไป' },
    { controlName: 'outOfStock', label: 'สินค้าหมด/เลิกผลิต' },
    { controlName: 'negativeReview', label: 'เห็นรีวิวไม่ดี' },
    { controlName: 'competitorOffer', label: 'ข้อเสนอของคู่แข่งดีกว่า' },
    { controlName: 'changedMind', label: 'เปลี่ยนใจ/ไม่ต้องการแล้ว' },
    { controlName: 'budgetCut', label: 'งบประมาณไม่พอ' }
  ];

  interestedProductsList = signal<ProductCategoryDropdownDto[]>([]);
  isLoadingCategories = signal(false);

  salesReportForm!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private productCategoryService: ProductCategoryService,
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
      contactInfo: ['', Validators.required],
      status: ['Success' as ReportStatus, Validators.required],
      reasons: this.fb.group({
        wantsToDecide: [false], waitingForPromo: [false], comparing: [false], consultingFamily: [false], needsMoreInfo: [false], waitingForStock: [false], financialApproval: [false], undecidedOnSpec: [false], seasonalTiming: [false], wantsToSeeSample: [false],
        priceTooHigh: [false], productMismatch: [false], badService: [false], foundCheaper: [false], longDelivery: [false], outOfStock: [false], negativeReview: [false], competitorOffer: [false], changedMind: [false], budgetCut: [false],
      }, { validators: requireAtLeastOne() }),
      interestedProducts: this.fb.group({}, { validators: requireAtLeastOne() }),
      additionalInfo: [''],
      saleValue: [0],
      invoiceId: ['']
    });
  }

  selectedStatus = signal<ReportStatus>('Success');

  ngOnInit(): void {
    this.loadProductCategories();
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

      const reasonControls = (this.salesReportForm.get('reasons') as FormGroup).controls;
      reportData.reasons.forEach((reasonText: string) => {
        const reason = [...this.pendingReasons, ...this.failedReasons].find(r => r.label === reasonText);
        if (reason && reasonControls[reason.controlName]) {
          reasonControls[reason.controlName].setValue(true);
        }
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
        contactInfo: '08x-xxx-xxxx'
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
      const transformedValue = {
        ...formValue,
        interestedProducts: selectedCategoryNames,
        interestedProductIds: selectedCategoryIds // Keep IDs for future use
      };
      
      this.save.emit(transformedValue);
    }
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
