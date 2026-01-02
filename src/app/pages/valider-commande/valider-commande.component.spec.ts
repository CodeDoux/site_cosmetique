import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValiderCommandeComponent } from './valider-commande.component';

describe('ValiderCommandeComponent', () => {
  let component: ValiderCommandeComponent;
  let fixture: ComponentFixture<ValiderCommandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValiderCommandeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValiderCommandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
