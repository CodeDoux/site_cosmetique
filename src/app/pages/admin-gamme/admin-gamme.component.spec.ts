import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGammeComponent } from './admin-gamme.component';

describe('AdminGammeComponent', () => {
  let component: AdminGammeComponent;
  let fixture: ComponentFixture<AdminGammeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGammeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
