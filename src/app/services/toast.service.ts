// services/toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'success', duration = 3000): void {
    const toast: Toast = { message, type, id: ++this.counter };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  remove(id: number): void {
    this.toastsSubject.next(
      this.toastsSubject.value.filter(t => t.id !== id)
    );
  }
}