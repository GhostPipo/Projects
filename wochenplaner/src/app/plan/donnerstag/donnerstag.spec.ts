import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Donnerstag } from './donnerstag';

describe('Donnerstag', () => {
  let component: Donnerstag;
  let fixture: ComponentFixture<Donnerstag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Donnerstag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Donnerstag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
