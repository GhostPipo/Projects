import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface PriceResponse {
  success: boolean;
  ek?: number;
  evp?: number;
  error?: string;
}

interface CartItem {
  id: string;
  ek: number;
  evp: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  productId: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  
  itemList: CartItem[] = [];

  constructor(private http: HttpClient) {}

  get totalEk(): number {
    return this.itemList.reduce((sum, item) => sum + item.ek, 0);
  }

  get totalEvp(): number {
    return this.itemList.reduce((sum, item) => sum + item.evp, 0);
  }

  removeItem(index: number) {
    this.itemList.splice(index, 1);
  }

  calculatePrice() {
    if (!this.productId.trim()) {
      this.error = 'Bitte eine Artikelnummer (z. B. Birner ID) eingeben.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    const currentId = this.productId.trim();

    // API Call to the local Node.js backend
    this.http.post<PriceResponse>('http://localhost:3000/api/calculate-price', { productId: currentId })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.ek !== undefined && response.evp !== undefined) {
            // Push to cart instead of replacing state
            this.itemList.push({
              id: currentId,
              ek: response.ek,
              evp: response.evp
            });
            // Clear input so user can type the next item immediately
            this.productId = '';
          } else {
            this.error = response.error || 'Fehler bei der Preisberechnung.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.error?.error || 'Netzwerkfehler. Konnte das Backend nicht erreichen.';
          console.error(err);
        }
      });
  }
}
