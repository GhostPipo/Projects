import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Freitag } from './freitag';

describe('Freitag', () => {
  let component: Freitag;
  let fixture: ComponentFixture<Freitag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Freitag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Freitag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
