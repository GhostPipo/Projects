import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTask } from './current-task';

describe('CurrentTask', () => {
  let component: CurrentTask;
  let fixture: ComponentFixture<CurrentTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
