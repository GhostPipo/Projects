import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Task } from '../../model/task.model';

@Component({
  selector: 'app-current-task',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-task.html',
  styleUrl: './current-task.css'
})
export class CurrentTaskComponent {
  tasks$: Observable<Task[]>;
  currentQuote: string = '';

  constructor(private taskService: TaskService) {
    this.tasks$ = this.taskService.tasks$;
    this.loadQuote();
  }

  onComplete(id: number) {
    this.taskService.completeTask(id);
  }

  onUncomplete(id: number) {
    this.taskService.uncompleteTask(id);
  }

  toggleTask(id: number) {
    // Hole die aktuelle Task-Liste
    this.taskService.tasks$.subscribe(tasks => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        if (task.isDone) {
          this.taskService.uncompleteTask(id);
        } else {
          this.taskService.completeTask(id);
        }
      }
    }).unsubscribe(); // Unsubscribe sofort, da wir nur einmal brauchen
  }

  onClear() {
    this.taskService.clearTasks();
  }

  loadQuote() {
    const quote = this.taskService.getMotivationalQuote();
    this.currentQuote = `"${quote.content}" - ${quote.author}`;
  }
}