// src/app/task/task.ts
import { Component } from '@angular/core';
import { CreateTaskComponent } from './create-task/create-task';
import { CurrentTaskComponent } from './current-task/current-task';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CreateTaskComponent, CurrentTaskComponent],
  templateUrl: './task.html',
  styleUrl: './task.css'
})
export class Task {}                                                         