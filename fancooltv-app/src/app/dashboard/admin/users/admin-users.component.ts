import { Component, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UserService, User } from '../../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  users: User[] = [];
  loading = false;
  noResults = false;
  currentPage = 1;
  perPage = 10; // Load 10 users at a time
  totalItems = 0;
  searchTerm = '';
  
  // Filter options
  statusFilter = '';
  roleFilter = '';
  genderFilter = '';
  
  // Modal properties
  modalRef?: BsModalRef;
  userToDelete: User | null = null;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private userService: UserService,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
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

    this.subscriptions.add(
      this.userService.getUsers(this.currentPage, this.perPage, this.searchTerm).subscribe({
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
   * Handle search button click
   */
  onSearchClick(): void {
    this.searchTerm = this.searchInput.nativeElement.value.trim();
    this.loadUsers(true);
  }

  /**
   * Handle status filter change
   */
  onStatusChange(event: any): void {
    this.statusFilter = event.target.value;
    this.applyFilters();
  }

  /**
   * Handle role filter change
   */
  onRoleChange(event: any): void {
    this.roleFilter = event.target.value;
    this.applyFilters();
  }

  /**
   * Handle gender filter change
   */
  onGenderChange(event: any): void {
    this.genderFilter = event.target.value;
    this.applyFilters();
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
   * Handle search input change (for real-time updates)
   */
  onSearchInputChange(): void {
    // Update searchTerm from input - no automatic search, only on Enter or Search button
    // This is just to keep the model in sync for the clear button visibility
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
      case 3: return 'Moderator';
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
  getUserFullName(user: User): string {
    return `${user.first_name} ${user.last_name}`.trim();
  }

  /**
   * Create new user (placeholder for future implementation)
   */
  createUser(): void {
    // TODO: Implement user creation modal/form
    alert('Create user functionality will be implemented soon');
  }

  /**
   * Edit user (placeholder for future implementation)
   */
  editUser(userId: number): void {
    // TODO: Implement user editing modal/form
    alert(`Edit user ${userId} functionality will be implemented soon`);
  }

  /**
   * Show delete confirmation modal
   */
  openDeleteModal(userId: number): void {
    // Find the user to delete
    this.userToDelete = this.users.find(u => u.user_id === userId) || null;
    
    if (this.userToDelete) {
      // Open the delete confirmation modal
      this.modalRef = this.modalService.show(this.deleteModal, {
        class: 'modal-md',
        backdrop: 'static',
        keyboard: false
      });
    }
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
   * Cancel user deletion
   */
  cancelDelete(): void {
    this.modalRef?.hide();
    this.userToDelete = null;
  }
}
