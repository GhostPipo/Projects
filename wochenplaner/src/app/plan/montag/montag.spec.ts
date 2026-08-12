import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Montag } from './montag';

describe('Montag', () => {
  let component: Montag;
  let fixture: ComponentFixture<Montag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Montag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Montag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
