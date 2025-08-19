import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TVSeries } from '../../../models/tvseries.models';
import { ApiService } from '../../../services/api.service';
import { TVSeriesFormComponent } from './tvseries-form.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-tvseries-form-page',
  templateUrl: './tvseries-form-page.component.html',
  styleUrls: ['./tvseries-form-page.component.scss']
})
export class TVSeriesFormPageComponent implements OnInit {
  @ViewChild('tvSeriesForm') tvSeriesForm!: TVSeriesFormComponent;
  
  tvSeries: TVSeries | null = null;
  isEditMode = false;
  pageTitle = 'Add New TV Series';
  loading = false;
  error = '';
  success = '';
  
  // Backup form data to preserve on error
  private formDataBackup: any = null;

  // Modal delete
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  modalRef?: BsModalRef;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    // Check if this is edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.pageTitle = 'Edit TV Series';
      this.loadTVSeries(+id);
    }
  }

  /**
   * Load TV series data for editing
   */
  loadTVSeries(id: number): void {
    this.loading = true;
    this.error = '';

    // Use the detailed API endpoint that includes all relations
    this.apiService.getTVSeriesDetails(id).subscribe({
      next: (response: any) => {
        this.tvSeries = response.data || response;
        if (!this.tvSeries) {
          this.error = 'TV series not found';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading TV series:', error);
        this.error = 'Failed to load TV series data';
        this.loading = false;
      }
    });
  }

  /**
   * Handle form submission with standard API endpoints like Movies
   */
  onFormSubmit(formData: FormData): void {
    // Backup current form data before submission
    this.backupFormData();
    
    this.loading = true;
    this.error = '';
    this.success = '';

    const request = this.isEditMode 
      ? this.apiService.updateCompleteTvSeries(this.tvSeries!.tv_series_id, formData)
      : this.apiService.createCompleteTvSeries(formData);

    request.subscribe({
      next: (response: any) => {
        console.log('TV Series saved successfully:', response);
        this.success = this.isEditMode 
          ? 'TV Series updated successfully!' 
          : 'TV Series created successfully!';
        this.loading = false;
        
        // Clear backup on success
        this.formDataBackup = null;
        
        // For edit mode, don't reload automatically - user can see success message
        if (this.isEditMode && this.tvSeries) {
          // Success message shown, no automatic reload
        } else {
          // For create mode, redirect to list
          setTimeout(() => {
            this.router.navigate(['/dashboard/admin/tvseries']);
          }, 2000);
        }
      },
      error: (error: any) => {
        console.error('Error saving TV series:', error);
        console.error('Full error response:', JSON.stringify(error.error, null, 2));
        
        this.loading = false;
        
        // Restore form data from backup to prevent data loss
        this.restoreFormData();
        
        // Handle server-side validation errors
        if (error.error && error.error.errors) {
          // Show general error message
          const errorMessages = Object.values(error.error.errors).flat();
          this.error = `Validation errors: ${errorMessages.join(', ')}`;
        } else if (error.error && error.error.message) {
          this.error = `Error: ${error.error.message}`;
        } else {
          this.error = this.isEditMode 
            ? 'Failed to update TV series. Please try again.'
            : 'Failed to create TV series. Please try again.';
        }
      }
    });
  }

  /**
   * Handle form cancellation
   */
  onFormCancel(): void {
    this.router.navigate(['/dashboard/admin/tvseries']);
  }

  /**
   * Show delete confirmation modal
   */
  showDeleteModal(): void {
    if (this.tvSeries) {
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-lg modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm TV series deletion
   */
  confirmDelete(): void {
    if (this.tvSeries) {
      this.loading = true;
      
      this.apiService.deleteTVSeries(this.tvSeries.tv_series_id).subscribe({
        next: (response: any) => {
          console.log('TV Series deleted successfully:', response);
          this.modalRef?.hide();
          this.loading = false;
          this.router.navigate(['/dashboard/admin/tvseries']);
        },
        error: (error: any) => {
          console.error('Error deleting TV series:', error);
          this.error = 'Failed to delete TV series';
          this.loading = false;
          this.modalRef?.hide();
        }
      });
    }
  }

  /**
   * Cancel TV series deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
  }

  /**
   * Navigate to TV series details view
   */
  viewTVSeries(): void {
    if (this.tvSeries) {
      this.router.navigate(['/tvseries-details', this.tvSeries.tv_series_id]);
    }
  }

  /**
   * Backup current form data before submission
   */
  private backupFormData(): void {
    if (this.tvSeriesForm && this.tvSeriesForm.tvSeriesForm) {
      this.formDataBackup = {
        formValue: { ...this.tvSeriesForm.tvSeriesForm.value },
        posterFile: this.tvSeriesForm.posterFile,
        backdropFile: this.tvSeriesForm.backdropFile,
        trailerVideoFile: this.tvSeriesForm.trailerVideoFile,
        episodeFiles: { ...this.tvSeriesForm.episodeFiles },
        episodeVideoFiles: { ...this.tvSeriesForm.episodeVideoFiles },
        posterPreviewUrl: this.tvSeriesForm.posterPreviewUrl,
        backdropPreviewUrl: this.tvSeriesForm.backdropPreviewUrl,
        episodeImagePreviewUrls: { ...this.tvSeriesForm.episodeImagePreviewUrls }
      };
    }
  }

  /**
   * Restore form data from backup to prevent data loss on error
   */
  private restoreFormData(): void {
    if (this.formDataBackup && this.tvSeriesForm) {
      // Restore form values
      this.tvSeriesForm.tvSeriesForm.patchValue(this.formDataBackup.formValue);
      
      // Restore file references
      this.tvSeriesForm.posterFile = this.formDataBackup.posterFile;
      this.tvSeriesForm.backdropFile = this.formDataBackup.backdropFile;
      this.tvSeriesForm.trailerVideoFile = this.formDataBackup.trailerVideoFile;
      this.tvSeriesForm.episodeFiles = this.formDataBackup.episodeFiles;
      this.tvSeriesForm.episodeVideoFiles = this.formDataBackup.episodeVideoFiles;
      
      // Restore preview URLs
      this.tvSeriesForm.posterPreviewUrl = this.formDataBackup.posterPreviewUrl;
      this.tvSeriesForm.backdropPreviewUrl = this.formDataBackup.backdropPreviewUrl;
      this.tvSeriesForm.episodeImagePreviewUrls = this.formDataBackup.episodeImagePreviewUrls;
    }
  }
}
