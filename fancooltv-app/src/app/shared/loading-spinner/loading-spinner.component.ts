import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Loading...';
  @Input() showMessage: boolean = true;
  @Input() overlay: boolean = false;
  @Input() color: 'primary' | 'secondary' | 'light' = 'primary';

  /**
   * Get CSS classes for spinner size
   */
  getSpinnerClasses(): string {
    const baseClasses = 'spinner-border';
    const sizeClass = this.size === 'small' ? 'spinner-border-sm' : '';
    const colorClass = `text-${this.color}`;
    
    return `${baseClasses} ${sizeClass} ${colorClass}`.trim();
  }

  /**
   * Get container CSS classes
   */
  getContainerClasses(): string {
    const baseClasses = 'loading-spinner-container';
    const overlayClass = this.overlay ? 'loading-overlay' : '';
    const sizeClass = `loading-${this.size}`;
    
    return `${baseClasses} ${overlayClass} ${sizeClass}`.trim();
  }
}
