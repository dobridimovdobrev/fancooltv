import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { UserService } from '../../../services/user.service';
import { CountryService } from '../../../services/country.service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  users: any[] = [];
  countries: any[] = [];
  loading = false;
  noResults = false;
  totalItems = 0;
  currentPage = 1;
  perPage = 10;
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';
  genderFilter = '';
  
  // Modal properties
  modalRef?: BsModalRef;
  userToDelete: any = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private router: Router,
    private modalService: BsModalService,
    private countryService: CountryService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCountries();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load users from API
   */
  loadUsers(reset: boolean = false): void {
    console.log('🔄 Loading users - Reset:', reset, 'Page:', this.currentPage);
    
    if (reset) {
      this.users = [];
      this.currentPage = 1;
    }

    this.loading = true;
    this.noResults = false;

    console.log('🌐 API Call with params:', {
      page: this.currentPage,
      perPage: this.perPage,
      search: this.searchTerm,
      status: this.statusFilter,
      gender: this.genderFilter,
      role: this.roleFilter
    });

    this.subscriptions.add(
      this.userService.getUsers(this.currentPage, this.perPage, this.searchTerm, this.statusFilter, this.genderFilter, this.roleFilter).subscribe({
        next: (response) => {
          console.log('✅ Users API response:', response);
          
          if (response && response.data) {
            if (reset) {
              this.users = response.data;
            } else {
              this.users = [...this.users, ...response.data];
            }
            
            this.totalItems = response.meta?.total || 0;
            this.noResults = this.users.length === 0;
            this.loading = false;
            
            console.log('📊 Users loaded:', this.users.length, 'Total:', this.totalItems);
            
            // Update the service subject
            this.userService.updateUsersSubject(this.users);
          } else {
            console.warn('⚠️ Invalid response format:', response);
            this.loading = false;
            this.noResults = true;
          }
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
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
   * Load more users (pagination)
   */
  loadMore(): void {
    if (this.users.length < this.totalItems && !this.loading) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  /**
   * Handle search input change (for real-time updates)
   */
  onSearchInputChange(): void {
    // Update searchTerm from input - no automatic search, only on Enter or Search button
    // This is just to keep the model in sync for the clear button visibility
  }

  /**
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchTerm = this.searchInput.nativeElement.value.trim();
    this.currentPage = 1;
    console.log('🔍 Search clicked with term:', this.searchTerm);
    console.log('🔍 All filters:', {
      search: this.searchTerm,
      status: this.statusFilter,
      gender: this.genderFilter,
      role: this.roleFilter
    });
    this.loadUsers(true);
  }

  /**
   * Handle status filter change
   */
  onStatusChange(event: any): void {
    this.statusFilter = event.target.value;
    this.currentPage = 1;
    console.log('📊 Status filter changed to:', this.statusFilter);
    this.loadUsers(true);
  }

  /**
   * Handle role filter change
   */
  onRoleChange(event: any): void {
    this.roleFilter = event.target.value;
    this.currentPage = 1;
    this.loadUsers(true);
  }

  /**
   * Handle gender filter change
   */
  onGenderChange(event: any): void {
    this.genderFilter = event.target.value;
    this.currentPage = 1;
    this.loadUsers(true);
  }

  /**
   * Apply filters to users list
   */
  private applyFilters(): void {
    // For now, we'll implement client-side filtering
    // In a real app, you'd want to send these filters to the API
    this.loadUsers(true);
  }

  /**
   * Clear search input and reload all users
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.searchInput.nativeElement.value = '';
    this.statusFilter = '';
    this.roleFilter = '';
    this.genderFilter = '';
    // Reset filter selects
    const selects = document.querySelectorAll('.filter-select') as NodeListOf<HTMLSelectElement>;
    selects.forEach(select => select.value = '');
    // Reset pagination and reload all users
    this.currentPage = 1;
    this.loadUsers(true);
  }

  /**
   * Delete user
   */
  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.subscriptions.add(
        this.userService.deleteUser(userId).subscribe({
          next: (response) => {
            console.log('User deleted successfully:', response.message);
            // Remove user from local array
            this.users = this.users.filter(user => user.user_id !== userId);
            this.userService.updateUsersSubject(this.users);
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
          }
        })
      );
    }
  }

  /**
   * Get user role name
   */
  getRoleName(roleId: number): string {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'User';
      default: return 'Unknown';
    }
  }

  /**
   * Get user status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-secondary';
      case 'banned': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  /**
   * Get user full name
   */
  getUserFullName(user: any): string {
    return `${user.first_name} ${user.last_name}`.trim();
  }

  /**
   * Navigate to create user page
   */
  createUser(): void {
    this.router.navigate(['/dashboard/admin/users/create']);
  }

  /**
   * Edit user - navigate to edit page
   */
  editUser(userId: number): void {
    // Navigate to edit page instead of opening modal
    this.router.navigate(['/dashboard/admin/users/edit', userId]);
  }

  /**
   * Confirm user deletion
   */
  confirmDelete(): void {
    if (this.userToDelete) {
      this.loading = true;
      
      this.userService.deleteUser(this.userToDelete.user_id).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);
          // Reload users list
          this.loadUsers(true);
          this.modalRef?.hide();
          this.userToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.loading = false;
          this.modalRef?.hide();
          this.userToDelete = null;
        }
      });
    }
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(userId: number): void {
    const user = this.users.find(u => u.user_id === userId);
    if (user) {
      this.userToDelete = user;
      this.modalRef = this.modalService.show(this.deleteModal);
    }
  }

  /**
   * Cancel user deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.userToDelete = null;
  }

  loadCountries(): void {
    this.countryService.getPublicCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  getCountryName(countryId: number): string {
    const country = this.countries.find((c: any) => c.country_id === countryId);
    return country ? country.name : 'Unknown';
  }

}
