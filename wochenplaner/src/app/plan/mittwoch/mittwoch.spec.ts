import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mittwoch } from './mittwoch';

describe('Mittwoch', () => {
  let component: Mittwoch;
  let fixture: ComponentFixture<Mittwoch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mittwoch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mittwoch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
