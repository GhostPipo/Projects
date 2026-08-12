import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dienstag } from './dienstag';

describe('Dienstag', () => {
  let component: Dienstag;
  let fixture: ComponentFixture<Dienstag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dienstag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dienstag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
