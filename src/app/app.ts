import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Loading } from './components/loading/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Loading],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('centro-frontend');
  isAuthChecking = signal(true);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Esperar a que se inicialice el estado de autenticación
    setTimeout(() => {
      this.isAuthChecking.set(false);
    }, 100); // Pequeño delay para evitar el flash
  }
}
