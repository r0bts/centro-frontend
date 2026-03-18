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
    path: 'configuracion/categorias',
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
    path: 'membresias',
    redirectTo: '/membresias/buscar',
    pathMatch: 'full'
  },
  {
    path: 'membresias/buscar',
    loadComponent: () => import('./components/membresias-buscar/membresias-buscar').then(m => m.MembresiasBuscarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'membresias/reglas',
    loadComponent: () => import('./components/membresias-reglas-lista/membresias-reglas-lista').then(m => m.MembresiasReglasListaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'membresias/reglas/crear',
    loadComponent: () => import('./components/membresias-reglas/membresias-reglas').then(m => m.MembresiasReglasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'membresias/reglas/editar/:id',
    loadComponent: () => import('./components/membresias-reglas/membresias-reglas').then(m => m.MembresiasReglasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'membresias/reglas/:id',
    loadComponent: () => import('./components/membresias-reglas-ver/membresias-reglas-ver').then(m => m.MembresiasReglasVerComponent),
    canActivate: [authGuard]
  },
  // =====================================================================
  // DEPORTIVO — Módulos 6-13
  // Shell con rutas hijas lazy-loaded para cada sección.
  // =====================================================================
  {
    path: 'deportivo',
    redirectTo: '/deportivo/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'deportivo',
    loadComponent: () =>
      import('./components/deportivo/shell/deportivo-shell').then(m => m.DeportivoShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/deportivo/dashboard/deportivo-dashboard').then(m => m.DeportivoDashboardComponent)
      },
      {
        path: 'actividades',
        loadComponent: () =>
          import('./components/deportivo/actividades/deportivo-actividades').then(m => m.DeportivoActividadesComponent)
      },
      {
        path: 'torneos',
        loadComponent: () =>
          import('./components/deportivo/torneos/deportivo-torneos').then(m => m.DeportivoTorneosComponent)
      },
      {
        path: 'finanzas',
        loadComponent: () =>
          import('./components/deportivo/finanzas/deportivo-finanzas').then(m => m.DeportivoFinanzasComponent)
      },
      {
        path: 'encuestas',
        loadComponent: () =>
          import('./components/deportivo/encuestas/deportivo-encuestas').then(m => m.DeportivoEncuestasComponent)
      },
      {
        path: 'comunicados',
        loadComponent: () =>
          import('./components/deportivo/comunicados/deportivo-comunicados').then(m => m.DeportivoComunicadosComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./components/deportivo/usuarios/deportivo-usuarios').then(m => m.DeportivoUsuariosComponent)
      },
      {
        path: 'sistema',
        loadComponent: () =>
          import('./components/deportivo/sistema/deportivo-sistema').then(m => m.DeportivoSistemaComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
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
