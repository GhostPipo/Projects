import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Samstag } from './samstag';

describe('Samstag', () => {
  let component: Samstag;
  let fixture: ComponentFixture<Samstag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Samstag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Samstag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
