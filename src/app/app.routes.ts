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
    path: 'requisicion',
    loadComponent: () => import('./components/requisition/requisition').then(m => m.RequisitionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'requisicion/crear',
    loadComponent: () => import('./components/requisition/requisition').then(m => m.RequisitionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'requisicion/lista',
    loadComponent: () => import('./components/requisition-list/requisition-list').then(m => m.RequisitionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'requisicion/confirmacion',
    loadComponent: () => import('./components/requisition-confirmation/requisition-confirmation').then(m => m.RequisitionConfirmationComponent),
    canActivate: [authGuard]
  },
  {
    path: 'requisicion/frecuentes',
    loadComponent: () => import('./components/frequent-templates/frequent-templates').then(m => m.FrequentTemplatesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'almacen/surtir',
    loadComponent: () => import('./components/warehouse-supply/warehouse-supply').then(m => m.WarehouseSupplyComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes',
    loadComponent: () => import('./components/reportes/reportes').then(m => m.ReportesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reportes/historial',
    loadComponent: () => import('./components/reportes/reportes').then(m => m.ReportesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion',
    redirectTo: '/configuracion/general',
    pathMatch: 'full'
  },
  {
    path: 'configuracion/general',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/usuarios',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/productos',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/netsuite',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/roles',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
