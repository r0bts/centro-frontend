import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos (:id) + autenticación requerida → Client-side rendering
  // RenderMode.Server haría el HTTP request en el servidor (sin token de auth),
  // el estado 401 se transferiría al cliente vía TransferState y el spinner quedaría congelado.
  {
    path: 'membresias/reglas/editar/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'membresias/reglas/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
