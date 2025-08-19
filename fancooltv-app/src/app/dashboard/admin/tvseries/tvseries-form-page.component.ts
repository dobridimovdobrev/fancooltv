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

    this.apiService.getTVSeries().subscribe({
      next: (response: any) => {
        // Find the specific TV series by ID
        const allSeries = response.data || [];
        this.tvSeries = allSeries.find((series: any) => series.tv_series_id === id);
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
   * Handle form submission
   */
  onFormSubmit(formData: any): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    const request = this.isEditMode 
      ? this.apiService.updateTVSeries(this.tvSeries!.tv_series_id, formData)
      : this.apiService.createTVSeries(formData);

    request.subscribe({
      next: (response: any) => {
        this.success = this.isEditMode 
          ? 'TV Series updated successfully!' 
          : 'TV Series created successfully!';
        this.loading = false;
        
        // Redirect to TV series list after a short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard/admin/tvseries']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error saving TV series:', error);
        this.error = error.error?.message || 'Failed to save TV series';
        this.loading = false;
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
}
