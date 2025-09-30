import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login),
    canActivate: [loginGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios').then(m => m.UsuariosComponent)
  },
  {
    path: 'empleados',
    loadComponent: () => import('./components/empleados/empleados').then(m => m.EmpleadosComponent)
  },
  {
    path: 'requisicion',
    loadComponent: () => import('./components/requisition/requisition').then(m => m.RequisitionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    loadComponent: () => import('./components/reportes/reportes').then(m => m.ReportesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documentos',
    loadComponent: () => import('./components/documentos/documentos').then(m => m.DocumentosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
