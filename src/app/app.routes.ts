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
    path: 'tutor-portal/login',
    loadComponent: () => import('./components/tutor-portal/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'tutor-portal/dashboard',
    loadComponent: () => import('./components/tutor-portal/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'tutor-portal/expediente-medico/completo/:id',
    loadComponent: () => import('./components/tutor-portal/medical-wizard/medical-wizard').then(m => m.MedicalWizardComponent)
  },
  {
    path: 'tutor-portal/expediente-medico/simplificado/:id',
    loadComponent: () => import('./components/tutor-portal/medical-simplified/medical-simplified').then(m => m.MedicalSimplifiedComponent)
  },
  {
    path: 'tutor-portal',
    redirectTo: '/tutor-portal/login',
    pathMatch: 'full'
  },
  {
    path: 'pase-salida/:token',
    loadComponent: () => import('./components/pickup-pass-view/pickup-pass-view').then(m => m.PickupPassViewComponent)
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
    path: 'configuracion/areas_clubes',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/roles',
    loadComponent: () => import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'configuracion/limites-departamento',
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
  {
    path: 'membresias/placas',
    loadComponent: () => import('./components/membresias-placas/membresias-placas').then(m => m.MembresiasPlacasComponent),
    canActivate: [authGuard]
  },
  // =====================================================================
  // SERVICIO MÉDICO — Módulo
  // =====================================================================
  {
    path: 'servicio-medico',
    redirectTo: '/servicio-medico/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'servicio-medico',
    loadComponent: () =>
      import('./components/servicio-medico/shell/servicio-medico-shell/servicio-medico-shell').then(m => m.ServicioMedicoShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/servicio-medico/dashboard/servicio-medico-dashboard/servicio-medico-dashboard').then(m => m.ServicioMedicoDashboard)
      },
      {
        path: 'escaner',
        loadComponent: () =>
          import('./components/servicio-medico/scanner/servicio-medico-scanner/servicio-medico-scanner').then(m => m.ServicioMedicoScanner)
      },
      {
        path: 'expediente/:token',
        loadComponent: () =>
          import('./components/servicio-medico/expediente/servicio-medico-expediente/servicio-medico-expediente').then(m => m.ServicioMedicoExpediente)
      },
      {
        path: 'socios',
        loadComponent: () =>
          import('./components/servicio-medico/socios/servicio-medico-socios/servicio-medico-socios').then(m => m.ServicioMedicoSocios)
      },
      {
        path: 'visitas',
        loadComponent: () =>
          import('./components/servicio-medico/visitas/servicio-medico-visitas/servicio-medico-visitas').then(m => m.ServicioMedicoVisitas)
      },
      {
        path: 'preregistros',
        loadComponent: () =>
          import('./components/servicio-medico/preregistros/servicio-medico-preregistros/servicio-medico-preregistros').then(m => m.ServicioMedicoPreregistros)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
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
        path: 'horarios',
        loadComponent: () =>
          import('./components/deportivo/horarios/deportivo-horarios').then(m => m.DeportivoHorariosComponent)
      },
      {
        path: 'torneos',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/deportivo/torneos/deportivo-torneos').then(m => m.DeportivoTorneosComponent)
          },
          {
            path: 'equipos',
            loadComponent: () =>
              import('./components/deportivo/equipos-torneo/deportivo-equipos-torneo').then(m => m.DeportivoEquiposTorneoComponent)
          },
          {
            path: ':id/marcadores',
            loadComponent: () =>
              import('./components/deportivo/torneos/torneo-marcadores/torneo-marcadores').then(m => m.TorneoMarcadoresComponent)
          }
        ]
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
  // =====================================================================
  // SUMMER COURSE — Module 15 (submodules 51-55)
  // Shell con lazy-loaded child routes para cada sección.
  // =====================================================================
  {
    path: 'summer-course',
    redirectTo: '/summer-course/courses',
    pathMatch: 'full'
  },
  {
    path: 'summer-course',
    loadComponent: () =>
      import('./components/summer-course/shell/summer-course-shell').then(m => m.SummerCourseShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'courses',
        loadComponent: () =>
          import('./components/summer-course/courses/summer-course-courses').then(m => m.SummerCourseCoursesComponent)
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./components/summer-course/activities/summer-course-activities').then(m => m.SummerCourseActivitiesComponent)
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./components/summer-course/enrollments/summer-course-enrollments').then(m => m.SummerCourseEnrollmentsComponent)
      },
      {
        path: 'levels',
        loadComponent: () =>
          import('./components/summer-course/levels/summer-course-levels').then(m => m.SummerCourseLevelsComponent)
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./components/summer-course/catalog/summer-course-catalog').then(m => m.SummerCourseCatalogComponent)
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('./components/summer-course/scanner/summer-course-scanner').then(m => m.SummerCourseScannerComponent)
      },
      {
        path: 'checkin-scanner',
        loadComponent: () =>
          import('./components/summer-course/checkin-scanner/summer-course-checkin-scanner').then(m => m.SummerCourseCheckinScannerComponent)
      },
      {
        path: 'pickup-history',
        loadComponent: () =>
          import('./components/summer-course/pickup-history/summer-course-pickup-history').then(m => m.SummerCoursePickupHistoryComponent)
      },
      {
        path: 'checkin-history',
        loadComponent: () =>
          import('./components/summer-course/checkin-history/summer-course-checkin-history').then(m => m.SummerCourseCheckinHistoryComponent)
      },
      {
        path: 'instructor-checklist',
        loadComponent: () =>
          import('./components/summer-course/instructor-checklist/summer-course-instructor-checklist').then(m => m.SummerCourseInstructorChecklistComponent)
      },
      {
        path: '',
        redirectTo: 'courses',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'configuracion/instructores',
    loadComponent: () =>
      import('./components/configuracion/configuracion').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized').then(m => m.UnauthorizedComponent)
  },
  {
    // Portal público del instructor — sin AuthGuard, sin login
    path: 'sc-scan/:groupAlias',
    loadComponent: () =>
      import('./components/summer-course/sc-scan/sc-scan.component').then(m => m.ScScanComponent)
  },
  {
    // Redirect de QR de credencial de instructor → página de escaneo de su grupo
    path: 'sc-instructor-scan/:token',
    loadComponent: () =>
      import('./components/summer-course/sc-instructor-scan/sc-instructor-scan.component').then(m => m.ScInstructorScanComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
