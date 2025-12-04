import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

/**
 * Directiva estructural para mostrar/ocultar elementos basado en permisos del usuario
 * 
 * Uso:
 * <button *hasPermission="{submodule: 'requisition', permission: 'create'}">
 *   Crear Requisición
 * </button>
 * 
 * <div *hasPermission="{submodule: 'usuarios', permission: 'update'}">
 *   Contenido visible solo con permiso de editar usuarios
 * </div>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissionConfig: { submodule: string; permission: string } | null = null;
  private permissionsSubscription?: Subscription;
  private hasView = false;

  @Input()
  set hasPermission(config: { submodule: string; permission: string }) {
    this.permissionConfig = config;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios en permisos
    this.permissionsSubscription = this.authService.permissions$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.permissionsSubscription?.unsubscribe();
  }

  private updateView(): void {
    if (!this.permissionConfig) {
      return;
    }

    const hasPermission = this.authService.hasPermission(
      this.permissionConfig.submodule,
      this.permissionConfig.permission
    );

    if (hasPermission && !this.hasView) {
      // Crear vista si tiene permiso y no existe
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Remover vista si no tiene permiso y existe
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
