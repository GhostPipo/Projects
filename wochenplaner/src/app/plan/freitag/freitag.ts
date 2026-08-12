import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../model/task.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-freitag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './freitag.html',
  styleUrl: './freitag.css',
})
export class Freitag implements OnInit, OnDestroy {
  tasks: Task[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.subscription = this.taskService.getTasksForDay('freitag').subscribe(tasks => {
      this.tasks = tasks.sort(this.prioritySort.bind(this));
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  completeTask(taskId: number) {
    this.taskService.completeTask(taskId);
  }

  private prioritySort(a: Task, b: Task): number {
    const order = { high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  }
}
