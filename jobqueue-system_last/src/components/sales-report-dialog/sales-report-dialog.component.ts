import { ChangeDetectionStrategy, Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Task } from '../task-column/task-column.component';
import { SalesReport, ReportStatus } from '../sales-report/sales-report.component';

@Component({
  selector: 'app-sales-report-dialog',
  standalone: true,
  templateUrl: './sales-report-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule]
})
export class SalesReportDialogComponent implements OnInit {
  task = input<Task | null>(null);
  report = input<SalesReport | null>(null);
  initialStatus = input<ReportStatus | null>(null);

  save = output<any>();
  close = output<void>();

  private fb = new FormBuilder();

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

  interestedProductsList = [
    { controlName: 'livingRoom', label: 'โซฟาและห้องนั่งเล่น' },
    { controlName: 'bedroom', label: 'ชุดห้องนอน' },
    { controlName: 'dining', label: 'โต๊ะอาหาร' },
    { controlName: 'kitchen', label: 'ชุดครัว' },
    { controlName: 'office', label: 'เฟอร์นิเจอร์สำนักงาน' },
    { controlName: 'outdoor', label: 'เฟอร์นิเจอร์นอกบ้าน' },
    { controlName: 'lighting', label: 'โคมไฟและของตกแต่ง' },
    { controlName: 'storage', label: 'ตู้และชั้นวางของ' },
    { controlName: 'kids', label: 'เฟอร์นิเจอร์เด็ก' }
  ];

  salesReportForm = this.fb.group({
    customerName: ['', Validators.required],
    contactInfo: ['', Validators.required],
    status: ['Success' as ReportStatus, Validators.required],
    reasons: this.fb.group({
      wantsToDecide: [false], waitingForPromo: [false], comparing: [false], consultingFamily: [false], needsMoreInfo: [false], waitingForStock: [false], financialApproval: [false], undecidedOnSpec: [false], seasonalTiming: [false], wantsToSeeSample: [false],
      priceTooHigh: [false], productMismatch: [false], badService: [false], foundCheaper: [false], longDelivery: [false], outOfStock: [false], negativeReview: [false], competitorOffer: [false], changedMind: [false], budgetCut: [false],
    }, { validators: this.requireAtLeastOne() }),
    interestedProducts: this.fb.group({
      livingRoom: [false], bedroom: [false], dining: [false], kitchen: [false], office: [false], outdoor: [false], lighting: [false], storage: [false], kids: [false]
    }, { validators: this.requireAtLeastOne() }),
    additionalInfo: ['']
  });

  selectedStatus = signal<ReportStatus>('Success');

  ngOnInit(): void {
    const reportData = this.report();
    const taskData = this.task();
    
    if (reportData) {
      this.salesReportForm.patchValue({
        customerName: reportData.customerName,
        contactInfo: reportData.contactInfo,
        status: reportData.status,
        additionalInfo: reportData.notes || ''
      });

      const reasonControls = (this.salesReportForm.get('reasons') as FormGroup).controls;
      reportData.reasons.forEach(reasonText => {
        const reason = [...this.pendingReasons, ...this.failedReasons].find(r => r.label === reasonText);
        if (reason && reasonControls[reason.controlName]) {
          reasonControls[reason.controlName].setValue(true);
        }
      });

      const productControls = (this.salesReportForm.get('interestedProducts') as FormGroup).controls;
      Object.keys(productControls).forEach(key => productControls[key].setValue(false));
      reportData.interestedProducts.forEach(productText => {
        const product = this.interestedProductsList.find(p => p.label === productText);
        if (product && productControls[product.controlName]) {
          productControls[product.controlName].setValue(true);
        }
      });
      
      this.setStatus(this.initialStatus() || reportData.status);
    } else if (taskData) {
      this.salesReportForm.patchValue({
        customerName: taskData.customerName || '',
        contactInfo: '08x-xxx-xxxx'
      });
      // Pre-check the product based on task details if available
      const productsForm = this.salesReportForm.get('interestedProducts') as FormGroup;
      if (taskData.details?.includes('โซฟา')) {
        productsForm.get('livingRoom')?.setValue(true);
      }
      this.setStatus('Success');
    } else {
      this.setStatus('Success');
    }
  }

  setStatus(status: ReportStatus) {
    this.selectedStatus.set(status);
    this.salesReportForm.controls.status.setValue(status);
    
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
      // FIX: Use getRawValue() to include disabled controls in the form's value.
      // When the status is 'Success', the 'reasons' form group is disabled.
      // Using .value would omit it from the emitted value, causing issues in the parent component.
      this.save.emit(this.salesReportForm.getRawValue());
    }
  }

  private requireAtLeastOne(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const formGroup = control as FormGroup;
        if (!formGroup) {
            return null;
        }
        // FIX: Replaced Object.values with Object.keys to prevent a type inference issue where
        // the control was being treated as `unknown`, causing an error when accessing `.value`.
        // This approach is more type-safe.
        const hasSelection = Object.keys(formGroup.controls).some(key => formGroup.controls[key].value);
        return hasSelection ? null : { requireAtLeastOne: true };
    };
  }
}