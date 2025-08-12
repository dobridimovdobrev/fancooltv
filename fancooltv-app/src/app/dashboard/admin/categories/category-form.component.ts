import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService, Category } from '../../../services/category.service';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  categoryForm!: FormGroup;
  category: Category | null = null;
  loading = false;
  isEditMode = false;
  categoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.categoryId = +params['id'];
        this.isEditMode = true;
        this.loadCategory();
      }
    });
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(64)]]
    });
  }

  private loadCategory(): void {
    if (!this.categoryId) return;

    this.loading = true;
    this.categoryService.getCategoryById(this.categoryId).subscribe({
      next: (response) => {
        this.category = response.data;
        this.populateForm(response.data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.loading = false;
        // Redirect to categories list if category not found
        this.router.navigate(['/dashboard/admin/categories']);
      }
    });
  }

  private populateForm(category: Category): void {
    this.categoryForm.patchValue({
      name: category.name
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.categoryForm.controls).forEach(key => {
        this.categoryForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formData = this.categoryForm.value;

    if (this.isEditMode && this.categoryId) {
      // Update existing category
      this.categoryService.updateCategory(this.categoryId, formData).subscribe({
        next: (response) => {
          console.log('Category updated successfully:', response);
          this.router.navigate(['/dashboard/admin/categories']);
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.loading = false;
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(formData).subscribe({
        next: (response) => {
          console.log('Category created successfully:', response);
          this.router.navigate(['/dashboard/admin/categories']);
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/admin/categories']);
  }
}
