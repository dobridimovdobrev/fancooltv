import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { CategoryService, Category } from '../../../services/category.service';

@Component({
  selector: 'app-admin-categories',
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.scss']
})
export class AdminCategoriesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  categories: Category[] = [];
  loading = false;
  noResults = false;
  
  // Modal properties
  modalRef?: BsModalRef;
  categoryToDelete: Category | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Called when component becomes active (Angular lifecycle)
   */
  ngAfterViewInit(): void {
    // Additional reset when view is initialized
    setTimeout(() => {
      this.loadCategories();
    }, 50);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load categories from API
   */
  loadCategories(): void {
    console.log('🔄 Loading categories');
    
    this.loading = true;
    this.noResults = false;

    this.subscriptions.add(
      this.categoryService.getCategories().subscribe({
        next: (response) => {
          console.log('✅ Categories API response:', response);
          
          if (response && response.data) {
            this.categories = response.data;
            this.loading = false;
            this.noResults = this.categories.length === 0;
            
            console.log('📊 Categories loaded:', this.categories.length);
            
            // Update the service subject
            this.categoryService.updateCategoriesSubject(this.categories);
          } else {
            console.warn('⚠️ Invalid response format:', response);
            this.loading = false;
            this.noResults = true;
          }
        },
        error: (error) => {
          console.error('❌ Error loading categories:', error);
          console.error('❌ Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          this.loading = false;
          this.noResults = true;
        }
      })
    );
  }

  /**
   * Navigate to create category form
   */
  createCategory(): void {
    this.router.navigate(['/dashboard/admin/categories/create']);
  }

  /**
   * Navigate to edit category form
   */
  editCategory(categoryId: number): void {
    this.router.navigate(['/dashboard/admin/categories/edit', categoryId]);
  }

  /**
   * Show delete confirmation modal
   */
  deleteCategory(categoryId: number): void {
    // Find the category to delete
    this.categoryToDelete = this.categories.find(c => c.category_id === categoryId) || null;
    
    if (this.categoryToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md',
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  /**
   * Confirm category deletion
   */
  confirmDelete(): void {
    if (this.categoryToDelete) {
      this.loading = true;
      
      this.categoryService.deleteCategory(this.categoryToDelete.category_id).subscribe({
        next: (response) => {
          console.log('Category deleted successfully:', response);
          // Reload categories list
          this.loadCategories();
          this.modalRef?.hide();
          this.categoryToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.categoryToDelete = null;
        }
      });
    }
  }

  /**
   * Cancel category deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.categoryToDelete = null;
  }
}
