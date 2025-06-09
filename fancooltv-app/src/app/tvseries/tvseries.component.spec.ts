import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TvseriesComponent } from './tvseries.component';

describe('TvseriesComponent', () => {
  let component: TvseriesComponent;
  let fixture: ComponentFixture<TvseriesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TvseriesComponent]
    });
    fixture = TestBed.createComponent(TvseriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
