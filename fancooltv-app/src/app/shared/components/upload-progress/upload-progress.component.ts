import { Component, Input, TrackByFunction, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface UploadItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  size?: number;
}

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss']
})
export class UploadProgressComponent implements OnInit, OnDestroy {
  @Input() items: UploadItem[] = [];
  @Input() showDetails: boolean = true;
  @Input() compact: boolean = false;

  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Calculate overall progress
  getOverallProgress(): number {
    if (!this.items.length) return 0;
    const totalProgress = this.items.reduce((sum: number, item: UploadItem) => sum + item.progress, 0);
    return Math.round(totalProgress / this.items.length);
  }

  // Check if all uploads are completed
  isAllCompleted(): boolean {
    return this.items.every((item: UploadItem) => item.status === 'completed');
  }
  
  hasErrors(): boolean {
    return this.items.some((item: UploadItem) => item.status === 'error');
  }
  
  hasUploading(): boolean {
    return this.items.some((item: UploadItem) => item.status === 'uploading');
  }
  
  hasPending(): boolean {
    return this.items.some((item: UploadItem) => item.status === 'pending');
  }

  // Get completed count
  getCompletedCount(): number {
    return this.items.filter((item: UploadItem) => item.status === 'completed').length;
  }

  // Get total count
  getTotalCount(): number {
    return this.items.length;
  }

  // Get error count
  getErrorCount(): number {
    return this.items.filter((item: UploadItem) => item.status === 'error').length;
  }

  // Get uploading count
  getUploadingCount(): number {
    return this.items.filter((item: UploadItem) => item.status === 'uploading').length;
  }

  // Format file size
  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Get progress bar color based on status
  getProgressBarColor(item: UploadItem): string {
    switch (item.status) {
      case 'completed': return 'success';
      case 'error': return 'danger';
      case 'uploading': return 'primary';
      default: return 'secondary';
    }
  }

  trackByItemId: TrackByFunction<UploadItem> = (index: number, item: UploadItem): string => {
    return item.id;
  }

  getCurrentUploadingItem(): UploadItem | null {
    return this.items.find((item: UploadItem) => item.status === 'uploading') || null;
  }

  // Get status icon
  getStatusIcon(item: UploadItem): string {
    switch (item.status) {
      case 'completed': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'uploading': return 'fa-spinner fa-spin';
      case 'pending': return 'fa-clock';
      default: return 'fa-file';
    }
  }
}
