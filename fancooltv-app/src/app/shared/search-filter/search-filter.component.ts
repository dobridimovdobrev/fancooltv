import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Category } from '../../models/media.models';

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  @Input() placeholder: string = 'Search...';
  @Input() categories: Category[] = [];
  @Input() years: number[] = [];
  @Input() showCategoryFilter: boolean = true;
  @Input() showYearFilter: boolean = true;
  @Input() debounceTime: number = 500;
  
  @Output() searchQuery = new EventEmitter<string>();
  @Output() categoryChange = new EventEmitter<string>();
  @Output() yearChange = new EventEmitter<string>();
  @Output() searchClick = new EventEmitter<string>();

  private searchSubscription?: Subscription;

  ngAfterViewInit(): void {
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Setup search input with debounce
   */
  private setupSearchDebounce(): void {
    if (this.searchInput) {
      this.searchSubscription = fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          debounceTime(this.debounceTime),
          distinctUntilChanged()
        )
        .subscribe(() => {
          const query = this.searchInput.nativeElement.value;
          this.searchQuery.emit(query);
        });
    }
  }

  /**
   * Handle search button click
   */
  onSearchClick(): void {
    if (this.searchInput) {
      const query = this.searchInput.nativeElement.value;
      this.searchClick.emit(query);
    }
  }

  /**
   * Handle category filter change
   */
  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.categoryChange.emit(select.value);
  }

  /**
   * Handle year filter change
   */
  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.yearChange.emit(select.value);
  }

  /**
   * Handle Enter key press in search input
   */
  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchClick();
    }
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.searchQuery.emit('');
    }
  }

  /**
   * Get current search value
   */
  getCurrentSearchValue(): string {
    return this.searchInput?.nativeElement?.value || '';
  }
}
