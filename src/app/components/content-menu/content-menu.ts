import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  signal, ChangeDetectionStrategy, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { NotificationService } from '../../services/notification.service';
import { MenuItem } from '../../models/auth.model';
import { filter } from 'rxjs/operators';

/** Módulo ID de Configuración — se separa del nav principal al engranaje */
const CONFIG_MODULE_ID = 'configuracion';

@Component({
  selector: 'app-content-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './content-menu.html',
  styleUrls: ['./content-menu.scss']
})
export class ContentMenu implements OnInit, OnDestroy {
  @Input() activeSection: string = '';
  @Output() sectionChange = new EventEmitter<string>();

  /** Items visibles en la barra principal (sin Configuración) */
  menuItems = signal<MenuItem[]>([]);

  /** Sub-items del módulo Configuración → van al engranaje */
  gearItems = signal<MenuItem[]>([]);

  /** Estado mobile menu */
  isMobileMenuOpen = signal(false);

  /** Estado dropdown engranaje */
  isGearOpen = signal(false);

  /** Estado panel de notificaciones */
  isNotifOpen = signal(false);

  constructor(
    private authService: AuthService,
    private menuService: MenuService,
    public notifService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.authService.permissions$.subscribe(() => {
      this.loadMenu();
      // Arrancar polling cuando el usuario está autenticado
      if (this.authService.isAuthenticated()) {
        this.notifService.startPolling();
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
      // Cerrar mobile menu al navegar
      this.isMobileMenuOpen.set(false);
      // Cerrar panel de notificaciones al navegar
      this.isNotifOpen.set(false);
    });
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
  }

  ngOnInit(): void {
    this.loadMenu();
    this.updateActiveStates();
    // Arrancar polling si el usuario ya tiene sesión activa al cargar el componente
    if (this.authService.isAuthenticated()) {
      this.notifService.startPolling();
    }
  }

  // ── Cargar menú ──────────────────────────────
  private loadMenu(): void {
    const allItems = this.menuService.generateMenu();

    // Separar Configuración al engranaje
    const configItem = allItems.find(i => i.id === CONFIG_MODULE_ID);
    const navItems   = allItems.filter(i => i.id !== CONFIG_MODULE_ID);

    this.menuItems.set(navItems);

    // Gear items: si el módulo tiene children los usamos, si es item simple lo envolvemos
    if (configItem?.children && configItem.children.length > 0) {
      this.gearItems.set(configItem.children);
    } else if (configItem) {
      this.gearItems.set([configItem]);
    } else {
      this.gearItems.set([]);
    }
  }

  // ── Estados activos ──────────────────────────
  private updateActiveStates(): void {
    const currentRoute = this.router.url;
    this.menuService.updateActiveState(this.menuItems(), currentRoute);
    this.menuItems.update(items => [...items]);
    this.cdr.markForCheck();
  }

  // ── Inicial del avatar ───────────────────────
  userInitial(): string {
    const user = this.authService.getCurrentUser();
    const name = (user as any)?.name || (user as any)?.username || 'U';
    return name.charAt(0).toUpperCase();
  }

  // ── Engranaje activo si algún sub-item de config está activo ──
  isGearActive(): boolean {
    return this.gearItems().some(child => this.isActive(child.id));
  }

  // ── Navegar desde notificación según permisos ────────────
  /**
   * type='autorizado':
   *   - tiene supply    → /almacen/surtir?id=REQ-XXXX  (abre la REQ directamente)
   *   - tiene authorize → /requisicion/confirmacion    (lista de REQs a confirmar)
   *   - cualquier otro  → /requisicion/lista
   *
   * type='listo_recoger' / 'entregado':
   *   - siempre         → /requisicion/lista
   */
  navigateFromNotif(n: import('../../services/notification.service').AppNotification): void {
    this.isNotifOpen.set(false);

    const hasSupply    = this.authService.hasPermission('requisition_list', 'supply');
    const hasAuthorize = this.authService.hasPermission('requisition_confirmation', 'authorize');

    if (n.type === 'autorizado') {
      if (hasSupply) {
        const reqCode = 'REQ-' + String(n.requisition_id).padStart(4, '0');
        this.router.navigate(['/almacen/surtir'], { queryParams: { id: reqCode } });
        return;
      }
      if (hasAuthorize) {
        this.router.navigate(['/requisicion/confirmacion']);
        return;
      }
    }

    // listo_recoger, entregado o sin permiso especial → lista del solicitante
    this.router.navigate(['/requisicion/lista']);
  }

  // ── Toggle notificaciones ────────────────────────
  toggleNotif(event: Event): void {
    event.stopPropagation();
    const opening = !this.isNotifOpen();
    this.isNotifOpen.set(opening);
    // Cerrar engranaje si está abierto
    this.isGearOpen.set(false);
    // Cargar notificaciones al abrir el panel
    if (opening) {
      this.notifService.loadAll();
    }
  }

  // ── Toggle engranaje ────────────────────────────
  toggleGear(event: Event): void {
    event.stopPropagation();
    this.isGearOpen.update(v => !v);
    // Cerrar notificaciones si están abiertas
    this.isNotifOpen.set(false);
    // Cerrar dropdowns del nav
    this.closeAllDropdowns();
  }

  // ── Toggle mobile hamburguesa ─────────────────
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  // ── Click en item de nav ──────────────────────
  onSectionClick(sectionId: string, event: Event): void {
    event.preventDefault();

    // Buscar en todos los items (nav + gear)
    const menuItem = this.findMenuItemById(sectionId)
      ?? this.gearItems().find(i => i.id === sectionId)
      ?? null;

    this.closeAllDropdowns();
    this.isGearOpen.set(false);
    this.isMobileMenuOpen.set(false);

    if (menuItem?.route) {
      this.router.navigate([menuItem.route]).catch(err =>
        console.error('❌ Error en navegación:', err)
      );
    } else {
      this.activeSection = sectionId;
      this.sectionChange.emit(sectionId);
    }
  }

  // ── Toggle dropdown de un item ────────────────
  toggleSubmenu(item: MenuItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const next = !item.isExpanded;

    this.menuItems.update(items => {
      items.forEach(i => { i.isExpanded = false; });
      item.isExpanded = next;
      return [...items];
    });

    this.cdr.markForCheck();
  }

  // ── Cerrar todos los dropdowns del nav ────────
  private closeAllDropdowns(): void {
    this.menuItems.update(items => {
      items.forEach(item => { item.isExpanded = false; });
      return [...items];
    });
  }

  // ── Click fuera → cerrar todo ─────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Si el clic no es dentro del nav, cerrar todo
    if (!target.closest('app-content-menu')) {
      this.closeAllDropdowns();
      this.isGearOpen.set(false);
      this.isNotifOpen.set(false);
      this.cdr.markForCheck();
    }
  }

  // ── Buscar item por ID ────────────────────────
  findMenuItemById(id: string): MenuItem | null {
    for (const item of this.menuItems()) {
      if (item.id === id) return item;
      if (item.children) {
        const child = item.children.find(c => c.id === id);
        if (child) return child;
      }
    }
    return null;
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.id));
  }

  isActive(sectionId: string): boolean {
    // Buscar en nav items y gear items
    const allItems = [...this.menuItems(), ...this.gearItems()];
    let menuItem: MenuItem | null = null;

    for (const item of allItems) {
      if (item.id === sectionId) { menuItem = item; break; }
      if (item.children) {
        const child = item.children.find(c => c.id === sectionId);
        if (child) { menuItem = child; break; }
      }
    }

    if (menuItem?.route) {
      try {
        const url = this.router.url;
        return url === menuItem.route || url.startsWith(menuItem.route + '/');
      } catch { /* ignore */ }
    }
    return this.activeSection === sectionId;
  }

  onLogout(): void {
    this.notifService.stopPolling();
    this.authService.logout().subscribe({
      next:  (r)   => console.log('Logout successful:', r.message),
      error: (err) => console.error('Logout error:', err)
    });
  }
}
