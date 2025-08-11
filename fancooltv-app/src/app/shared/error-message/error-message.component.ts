import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent {
  @Input() message: string = '';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Input() dismissible: boolean = false;
  @Input() showIcon: boolean = true;
  @Input() title: string = '';
  @Output() dismissed = new EventEmitter<void>();

  /**
   * Get alert CSS classes based on type
   */
  getAlertClasses(): string {
    const baseClasses = 'alert';
    const typeClass = `alert-${this.type}`;
    const dismissibleClass = this.dismissible ? 'alert-dismissible' : '';
    
    return `${baseClasses} ${typeClass} ${dismissibleClass}`.trim();
  }

  /**
   * Get icon class based on error type
   */
  getIconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'fa-solid fa-circle-exclamation';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'info':
        return 'fa-solid fa-circle-info';
      default:
        return 'fa-solid fa-circle-exclamation';
    }
  }

  /**
   * Get default title based on type
   */
  getTitle(): string {
    if (this.title) {
      return this.title;
    }

    switch (this.type) {
      case 'danger':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  }

  /**
   * Handle dismiss button click
   */
  onDismiss(): void {
    this.dismissed.emit();
  }
}
