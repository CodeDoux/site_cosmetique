import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPaiementComponent } from './admin-paiement.component';

describe('AdminPaiementComponent', () => {
  let component: AdminPaiementComponent;
  let fixture: ComponentFixture<AdminPaiementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaiementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPaiementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
