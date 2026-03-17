import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos (:id) → Client-side rendering
  // No se pueden prerender sin getPrerenderParams
  {
    path: 'membresias/reglas/editar/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'membresias/reglas/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
