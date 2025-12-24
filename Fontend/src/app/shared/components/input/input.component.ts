import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() error?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() name?: string;
  @Input() id?: string;
  @Input() autocomplete?: string;
  @Input() min?: string | number;
  @Input() max?: string | number;
  @Input() step?: string | number;
  @Input() pattern?: string;
  @Input() maxlength?: number;
  @Input() minlength?: number;

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get inputClass(): string {
    const base = 'w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-colors';
    return this.error 
      ? `${base} border-red-300 focus:ring-red-500`
      : `${base} border-slate-300`;
  }

  get inputId(): string {
    return this.id || this.name || `input-${Math.random().toString(36).substr(2, 9)}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

