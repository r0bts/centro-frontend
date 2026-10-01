import { Routes } from '@angular/router';

export const DOCMGMT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/procedure-list/procedure-list').then(m => m.ProcedureListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/procedure-form/procedure-form').then(m => m.ProcedureFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/procedure-detail/procedure-detail').then(m => m.ProcedureDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/procedure-form/procedure-form').then(m => m.ProcedureFormComponent)
  }
];
