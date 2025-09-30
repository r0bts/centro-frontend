import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { ContentMenu } from '../content-menu/content-menu';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ContentMenu],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'dashboard';
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  onSectionChange(section: string): void {
    this.activeSection = section;
    // El cambio de sección ahora es manejado por el router
  }
}
