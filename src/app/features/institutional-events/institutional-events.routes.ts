import { Routes } from '@angular/router';
import { EventsListPageComponent } from './pages/events-list-page/events-list-page';
import { EventFormPageComponent } from './pages/event-form-page/event-form-page';
import { EventAttendeesPageComponent } from './pages/event-attendees-page/event-attendees-page';
import { EventCheckinPageComponent } from './pages/event-checkin-page/event-checkin-page';
import { EventSummaryPageComponent } from './pages/event-summary-page/event-summary-page';

/**
 * Rutas hijas del módulo de Eventos Institucionales, montadas bajo `/eventos`
 * en app.routes.ts vía `loadChildren`.
 */
export const INSTITUTIONAL_EVENTS_ROUTES: Routes = [
  { path: '', component: EventsListPageComponent },
  { path: 'crear', component: EventFormPageComponent },
  { path: 'editar/:id', component: EventFormPageComponent },
  // SCR-005 — Inscritos
  { path: ':id/inscritos', component: EventAttendeesPageComponent },
  // SCR-006 — Check-in / Asistencia
  { path: ':id/checkin', component: EventCheckinPageComponent },
  // SCR-007 — Resumen ejecutivo
  { path: ':id/resumen', component: EventSummaryPageComponent },
];

