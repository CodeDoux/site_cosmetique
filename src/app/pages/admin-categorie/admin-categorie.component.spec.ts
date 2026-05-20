import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCategorieComponent } from './admin-categorie.component';

describe('AdminCategorieComponent', () => {
  let component: AdminCategorieComponent;
  let fixture: ComponentFixture<AdminCategorieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategorieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCategorieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
