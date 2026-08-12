import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sonntag } from './sonntag';

describe('Sonntag', () => {
  let component: Sonntag;
  let fixture: ComponentFixture<Sonntag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sonntag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sonntag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
