import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '../model/task.model';
import { BehaviorSubject, map } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();
  private readonly STORAGE_KEY = 'wochenplaner_tasks';
  private lastLoadedUser: string | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadTasksFromStorage();
  }

  /**
   * Lädt alle Tasks für den aktuellen Benutzer aus localStorage
   */
  private loadTasksFromStorage(): void {
    const currentUser = this.authService.getCurrentUser();
    
    // Nur neu laden wenn der Benutzer gewechselt hat
    if (currentUser !== this.lastLoadedUser) {
      this.lastLoadedUser = currentUser;
      
      if (currentUser) {
        const allTasks = this.getAllStoredTasks();
        this.tasks = allTasks.filter(task => task.username === currentUser);
        this.tasksSubject.next([...this.tasks]);
        console.log(`TaskService: ${this.tasks.length} Tasks für Benutzer "${currentUser}" geladen`);
      } else {
        this.tasks = [];
        this.tasksSubject.next([]);
        console.log('TaskService: Kein Benutzer eingeloggt, Tasks geleert');
      }
    }
  }

  /**
   * Holt alle Tasks aus localStorage (für alle Benutzer)
   */
  private getAllStoredTasks(): Task[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Speichert alle Tasks in localStorage
   */
  private saveTasksToStorage(): void {
    const allTasks = this.getAllStoredTasks();
    const currentUser = this.authService.getCurrentUser();

    // Entferne alte Tasks dieses Benutzers
    const otherUsersTasks = allTasks.filter(task => task.username !== currentUser);

    // Kombiniere mit aktuellen Tasks
    const tasksToStore = [...otherUsersTasks, ...this.tasks];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasksToStore));
    console.log(`TaskService: Tasks für Benutzer "${currentUser}" gespeichert`);
  }

  addTask(task: Task): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      task.username = currentUser;
      task.id = this.generateTaskId();
      this.tasks.push(task);
      this.saveTasksToStorage();
      this.tasksSubject.next([...this.tasks]);
      console.log(`TaskService: Task hinzugefügt für "${currentUser}":`, task);
    }
  }

  /**
   * Generiert eine eindeutige Task-ID
   */
  private generateTaskId(): number {
    const allTasks = this.getAllStoredTasks();
    return allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
  }

  // Diese Methode setzt den Task auf "erledigt" und übersetzt in Yoda-Sprache
  completeTask(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && !task.isDone) {
      task.isDone = true;
      task.yodaText = this.yodaTranslate(task.title);
      this.saveTasksToStorage();
      this.tasksSubject.next([...this.tasks]);
    }
  }

  // Methode, um Task rückgängig zu machen
  uncompleteTask(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.isDone) {
      task.isDone = false;
      task.yodaText = undefined;
      this.saveTasksToStorage();
      this.tasksSubject.next([...this.tasks]);
    }
  }

  /**
   * Löscht einen Task
   */
  deleteTask(taskId: number): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveTasksToStorage();
    this.tasksSubject.next([...this.tasks]);
  }

  private yodaTranslate(text: string): string {
    // Einfache Simulation: Kehre Wortreihenfolge um und füge Yoda-Elemente hinzu
    const words = text.split(' ');
    const reversed = words.reverse().join(' ');
    return `Hmm, ${reversed}, you must.`;
  }

  clearTasks(): void {
    const currentUser = this.authService.getCurrentUser();
    this.tasks = [];
    // Entferne auch Tasks dieses Benutzers aus dem Storage
    const allTasks = this.getAllStoredTasks();
    const otherUsersTasks = allTasks.filter(task => task.username !== currentUser);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(otherUsersTasks));
    this.tasksSubject.next([]);
    console.log(`TaskService: Tasks für Benutzer "${currentUser}" gelöscht`);
  }

  getTasksForDay(day: string) {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.day === day))
    );
  }

  /**
   * Lädt Tasks neu, wenn der Benutzer gewechselt wird (z.B. nach Login)
   * Setzt den lastLoadedUser zurück, sodass die Tasks definitiv neu geladen werden
   */
  refreshTasksForCurrentUser(): void {
    this.lastLoadedUser = null;
    this.loadTasksFromStorage();
  }

  getMotivationalQuote() {
    const quotes = [
      { content: "Der einzige Weg, großartige Arbeit zu leisten, ist, das zu lieben, was du tust.", author: "Steve Jobs" },
      { content: "Glaube, dass du kannst, und du bist schon halbwegs dort.", author: "Theodore Roosevelt" },
      { content: "Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.", author: "Eleanor Roosevelt" },
      { content: "Du musst tun, was du denkst, dass du nicht kannst.", author: "Eleanor Roosevelt" },
      { content: "Der Erfolg ist nicht endgültig, das Scheitern ist nicht fatal: Mut zum Weitermachen zählt.", author: "Winston Churchill" },
      { content: "Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die zweitbeste Zeit ist jetzt.", author: "Chinesisches Sprichwort" },
      { content: "Nicht weil es einfach ist, wagen wir es, sondern weil es schwer ist.", author: "John F. Kennedy" },
      { content: "Dein Zeit ist begrenzt, also verschwende sie nicht damit, das Leben eines anderen zu leben.", author: "Steve Jobs" },
      { content: "Die Reise von tausend Meilen beginnt mit einem einzigen Schritt.", author: "Laotse" },
      { content: "Sei die Veränderung, die du in der Welt sehen willst.", author: "Mahatma Gandhi" }
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }
}