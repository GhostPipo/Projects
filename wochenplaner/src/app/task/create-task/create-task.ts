import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task } from '../../model/task.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-task.html',
  styleUrl: './create-task.css'
})
export class CreateTaskComponent {
  newTask: Partial<Task> = {
    priority: 'low',
    isDone: false
  };

  constructor(private taskService: TaskService, private authService: AuthService) {}

  setPriority(p: 'low' | 'medium' | 'high') {
    this.newTask.priority = p;
  }

  saveTask() {
    if (this.newTask.title && this.newTask.day) {
      const currentUser = this.authService.getCurrentUser();
      const task: Task = {
        id: Date.now(),
        title: this.newTask.title,
        day: this.newTask.day,
        duration: this.newTask.duration || 0,
        priority: this.newTask.priority as 'low' | 'medium' | 'high',
        isDone: false,
        username: currentUser || 'unknown'
      };
      this.taskService.addTask(task);
      // Reset form
      this.newTask = { priority: 'low', isDone: false };
    }
  }
}