import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Rutas públicas ──────────────────────────────────────────────────────
  // Login no necesita auth pero tampoco tiene datos dinámicos del servidor
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'unauthorized',
    renderMode: RenderMode.Client,
  },

  // ── Rutas protegidas con authGuard → siempre Client ─────────────────────
  // authGuard lee localStorage (token JWT) que no existe en el servidor.
  // Con RenderMode.Server el guard emite isAuthenticated=false → redirige a
  // /login en el servidor, ese estado se hidrata en el browser → spinner
  // eterno o redirección falsa.
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'requisicion',
    renderMode: RenderMode.Client,
  },
  {
    path: 'requisicion/crear',
    renderMode: RenderMode.Client,
  },
  {
    path: 'requisicion/lista',
    renderMode: RenderMode.Client,
  },
  {
    path: 'requisicion/confirmacion',
    renderMode: RenderMode.Client,
  },
  {
    path: 'requisicion/frecuentes',
    renderMode: RenderMode.Client,
  },
  {
    path: 'almacen/surtir',
    renderMode: RenderMode.Client,
  },
  {
    path: 'reportes',
    renderMode: RenderMode.Client,
  },
  {
    path: 'reportes/historial',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/general',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/usuarios',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/productos',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/categorias',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/netsuite',
    renderMode: RenderMode.Client,
  },
  {
    path: 'configuracion/roles',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/buscar',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/reglas',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/reglas/crear',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/reglas/editar/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/reglas/:id',
    renderMode: RenderMode.Client,
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  {
    path: '**',
    renderMode: RenderMode.Client,
  }
];
