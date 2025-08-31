import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TVSeries } from '../../../models/tvseries.models';
import { ApiService } from '../../../services/api.service';
import { TVSeriesFormComponent } from './tvseries-form.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { ApiResponse } from '../../../models/api.models';

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
  @ViewChild('uploadProgressModal') uploadProgressModal!: TemplateRef<any>;
  modalRef?: BsModalRef;
  uploadModalRef?: BsModalRef;
  
  // Upload progress tracking
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadCompleted: boolean = false;
  uploadSuccessMessage: string = '';

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
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
   * Handle form submission with upload progress tracking like Movies
   */
  onFormSubmit(formData: FormData): void {
    // Backup current form data before submission
    this.backupFormData();
    
    this.error = '';
    this.success = '';
    
    // Solo per FormData (upload file) impostiamo loading = true e resettiamo upload state
    const isFileUpload = formData instanceof FormData;
    if (isFileUpload) {
      this.loading = true;
      this.resetUploadState();
    }

    const request = this.isEditMode 
      ? this.apiService.updateCompleteTvSeries(this.tvSeries!.tv_series_id, formData)
      : this.apiService.createCompleteTvSeries(formData);

    // Verifica se ci sono file reali da caricare nel FormData
    const hasActualFiles = this.hasFileUploads(formData);
    console.log('Has actual file uploads:', hasActualFiles);

    // Gestione con tracking upload progress come nei movies
    if (formData instanceof FormData && hasActualFiles) {
      // Upload con file - usa eventi HTTP per tracking
      request.subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            console.log(`TV Series upload progress: ${progress}% (${event.loaded}/${event.total})`);
            
            if (!this.uploadModalRef) {
              this.showUploadProgressModal();
            }
            this.updateUploadProgress(progress);
            
            if (progress === 25 || progress === 50 || progress === 75 || progress >= 90) {
              console.log(`Punto critico raggiunto: ${progress}%`);
            }
          } else if (event.type === HttpEventType.Response) {
            const response = event as HttpResponse<ApiResponse<TVSeries>>;
            console.log('TV Series upload completed, setting progress to 100%');
            this.updateUploadProgress(100);
            this.setUploadSuccessMessage(this.isEditMode ? 'TV Series aggiornata con successo!' : 'TV Series creata con successo!');
            
            setTimeout(() => {
              if (response && response.body && response.body.data) {
                this.tvSeries = response.body.data;
              }
              this.loading = false;
              
              // Clear backup on success
              this.formDataBackup = null;
              
              // For edit mode, reload data to show changes
              if (this.isEditMode && this.tvSeries) {
                setTimeout(() => {
                  this.loadTVSeries(this.tvSeries!.tv_series_id);
                }, 1000);
              } else {
                // For create mode, redirect to list
                setTimeout(() => {
                  this.router.navigate(['/dashboard/admin/tvseries']);
                }, 2000);
              }
            }, 2500);
          }
        },
        error: (error: any) => {
          console.error('Error saving TV series:', error);
          console.error('Full error response:', JSON.stringify(error.error, null, 2));
          
          this.loading = false;
          this.resetUploadState();
          this.closeUploadProgressModal();
          
          // Restore form data from backup to prevent data loss
          this.restoreFormData();
          
          // Handle server-side validation errors
          if (error.error && error.error.errors) {
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
    } else {
      // Update semplice senza file - risposta diretta come nei movies
      this.loading = true;
      request.subscribe({
        next: (response: any) => {
          console.log('🔥 Direct TV Series update response:', response);
          
          // Aggiorna dati
          if (response && response.data) {
            this.tvSeries = response.data;
          }
          
          // Mostra messaggio di successo normale
          this.success = this.isEditMode 
            ? 'TV Series aggiornata con successo!' 
            : 'TV Series creata con successo!';
          
          console.log('🎉 SUCCESS MESSAGE SET:', this.success);
          
          this.loading = false;
          
          // Clear backup on success
          this.formDataBackup = null;
          
          // Forza change detection
          this.changeDetectorRef.detectChanges();
          
          // For edit mode, reload data to show changes
          if (this.isEditMode && this.tvSeries) {
            setTimeout(() => {
              this.loadTVSeries(this.tvSeries!.tv_series_id);
            }, 1000);
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
  }

  /**
   * Check if FormData contains actual file uploads
   */
  private hasFileUploads(formData: FormData): boolean {
    let hasFiles = false;
    
    // Check for video files in episodes
    formData.forEach((value, key) => {
      if (key.includes('episodes[') && key.includes('[episode_video]') && value instanceof File) {
        console.log('Found episode video file:', key, value.name);
        hasFiles = true;
      }
      if (key.includes('trailer_video') && value instanceof File) {
        console.log('Found trailer video file:', key, value.name);
        hasFiles = true;
      }
      if (key.includes('poster_image') && value instanceof File) {
        console.log('Found poster image file:', key, value.name);
        hasFiles = true;
      }
      if (key.includes('backdrop_image') && value instanceof File) {
        console.log('Found backdrop image file:', key, value.name);
        hasFiles = true;
      }
      if (key.includes('still_image') && value instanceof File) {
        console.log('Found episode still image file:', key, value.name);
        hasFiles = true;
      }
    });
    
    console.log('Total files found in FormData:', hasFiles);
    return hasFiles;
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
        next: (response) => {
          console.log('TV Series saved successfully:', response);
          console.log('DEBUG: Full backend response:', JSON.stringify(response, null, 2));
          
          // Check if the response contains the updated data
          // Response debug removed
          
          this.loading = false;
          // Reload the current page to see if changes persisted
          window.location.reload();
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
   * View TV series details
   */
  viewTVSeries(): void {
    if (this.tvSeries) {
      this.router.navigate(['/tvseries-details', this.tvSeries.tv_series_id]);
    }
  }

  /**
   * Trigger form submit from top button - identical to bottom button
   */
  triggerFormSubmit(): void {
    if (this.tvSeriesForm) {
      // Chiama il metodo onSubmit del componente figlio - stesso comportamento del pulsante inferiore
      this.tvSeriesForm.onSubmit();
    }
  }

  // Upload progress methods - copied from movies
  public updateUploadProgress(progress: number): void {
    console.log('🚀 TV SERIES PAGE - updateUploadProgress called with:', progress);
    this.ngZone.run(() => {
      this.uploadProgress = progress;
      this.isUploading = progress > 0 && progress < 100;
      
      if (progress >= 100) {
        this.uploadCompleted = true;
        this.isUploading = false;
      }
      
      console.log('🚀 TV SERIES PAGE - Progress updated:', {
        uploadProgress: this.uploadProgress,
        isUploading: this.isUploading,
        uploadCompleted: this.uploadCompleted
      });
      
      this.changeDetectorRef.detectChanges();
      this.changeDetectorRef.markForCheck();
    });
  }

  public setUploadSuccessMessage(message: string): void {
    console.log('🚀 TV SERIES PAGE - setUploadSuccessMessage called with:', message);
    this.ngZone.run(() => {
      this.uploadSuccessMessage = message;
      this.uploadCompleted = true;
      this.isUploading = false;
      
      console.log('🚀 TV SERIES PAGE - Success message set:', this.uploadSuccessMessage);
      
      this.changeDetectorRef.detectChanges();
      
      // Auto close modal after 2 seconds
      setTimeout(() => {
        this.closeUploadProgressModal();
      }, 2000);
    });
  }

  public resetUploadState(): void {
    console.log('🚀 TV SERIES PAGE - resetUploadState called');
    this.ngZone.run(() => {
      this.uploadProgress = 0;
      this.isUploading = false;
      this.uploadCompleted = false;
      this.uploadSuccessMessage = '';
      
      console.log('🚀 TV SERIES PAGE - Upload state reset');
      
      this.changeDetectorRef.detectChanges();
    });
  }

  public showUploadProgressModal(): void {
    if (!this.uploadModalRef) {
      this.uploadModalRef = this.modalService.show(this.uploadProgressModal, {
        backdrop: 'static',
        keyboard: false,
        class: 'modal-dialog-centered'
      });
    }
  }

  public closeUploadProgressModal(): void {
    if (this.uploadModalRef) {
      this.uploadModalRef.hide();
      this.uploadModalRef = undefined;
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
