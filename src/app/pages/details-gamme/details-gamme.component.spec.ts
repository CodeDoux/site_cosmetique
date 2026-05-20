import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsGammeComponent } from './details-gamme.component';

describe('DetailsGammeComponent', () => {
  let component: DetailsGammeComponent;
  let fixture: ComponentFixture<DetailsGammeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsGammeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsGammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
