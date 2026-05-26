import {
  Component, Input, Output, EventEmitter, OnInit,
  signal, ChangeDetectionStrategy, HostListener, ChangeDetectorRef,
  ViewChild, ElementRef, AfterViewInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { MenuItem } from '../../models/auth.model';
import { NotificationService, AppNotification } from '../../services/notification.service';
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
export class ContentMenu implements OnInit, AfterViewInit, OnDestroy {
  @Input() activeSection: string = '';
  @Output() sectionChange = new EventEmitter<string>();

  @ViewChild('navList') navList!: ElementRef<HTMLUListElement>;

  indicatorStyle = signal({ left: '0px', top: '0px', width: '0px', height: '0px', opacity: 0 });

  /** Items visibles en la barra principal (sin Configuración) */
  menuItems = signal<MenuItem[]>([]);

  /** Sub-items del módulo Configuración → van al engranaje */
  gearItems = signal<MenuItem[]>([]);

  /** Estado mobile menu */
  isMobileMenuOpen = signal(false);

  /** Estado dropdown engranaje */
  isGearOpen = signal(false);

  /** Estado dropdown avatar */
  isAvatarOpen = signal(false);

  /** Estado panel notificaciones */
  isNotifOpen = signal(false);

  constructor(
    private authService: AuthService,
    private menuService: MenuService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public notifService: NotificationService
  ) {
    this.authService.permissions$.subscribe(() => {
      this.loadMenu();
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
      // Cerrar mobile menu al navegar
      this.isMobileMenuOpen.set(false);
    });
  }

  private resizeObserver!: ResizeObserver;

  ngOnInit(): void {
    this.loadMenu();
    this.updateActiveStates();
    this.notifService.startPolling();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateIndicator(), 100);
    
    // Escuchar redimensionamiento para ajustar el indicador
    this.resizeObserver = new ResizeObserver(() => {
      this.updateIndicator();
    });
    if (this.navList?.nativeElement) {
      this.resizeObserver.observe(this.navList.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
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
    setTimeout(() => this.updateIndicator(), 50);
  }

  // ── Actualizar indicador deslizante ──────────
  updateIndicator(): void {
    if (!this.navList?.nativeElement) return;
    
    const activeLink = this.navList.nativeElement.querySelector('.topnav-link.active') as HTMLElement;
    if (activeLink) {
      // Necesitamos asegurar que el elemento esté visible y renderizado
      const listRect = this.navList.nativeElement.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      // Si el item está oculto o no tiene tamaño
      if (linkRect.width === 0) return;

      this.indicatorStyle.set({
        left: `${linkRect.left - listRect.left}px`,
        top: `${linkRect.top - listRect.top}px`,
        width: `${linkRect.width}px`,
        height: `${linkRect.height}px`,
        opacity: 1
      });
    } else {
      this.indicatorStyle.update(s => ({ ...s, opacity: 0 }));
    }
    this.cdr.markForCheck();
  }

  // ── Inicial(es) del avatar ──────────────────────────────────────────
  userInitial(): string {
    const user = this.authService.getCurrentUser();
    const first = (user as any)?.first_name || '';
    const last  = (user as any)?.last_name  || '';
    if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase();
    const name = first || (user as any)?.username || 'U';
    return name.charAt(0).toUpperCase();
  }

  // ── Nombre completo del usuario ──────────────────────────────
  userDisplayName(): string {
    const user = this.authService.getCurrentUser();
    const first = (user as any)?.first_name || '';
    const last  = (user as any)?.last_name  || '';
    if (first || last) return `${first} ${last}`.trim();
    return (user as any)?.username || 'Usuario';
  }

  // ── Rol del usuario ─────────────────────────────────────────
  userRoleLabel(): string {
    const roles = this.authService.getRoles();
    if (roles && roles.length > 0) {
      return roles[0].display_name || roles[0].name || 'Sin rol';
    }
    return 'Sin rol';
  }

  // ── Email del usuario ────────────────────────────────────
  userEmail(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.email || '';
  }

  // ── Departamento del usuario ─────────────────────────────
  userDepartment(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.department_name || '';
  }

  // ── Sucursal / Location ─────────────────────────────────
  userLocation(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.location_name || '';
  }

  // ── Número de empleado ────────────────────────────────
  userEmployeeNumber(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.number_employee || '';
  }

  // ── Toggle avatar dropdown ──────────────────────────────
  toggleAvatar(event: Event): void {
    event.stopPropagation();
    this.isAvatarOpen.update(v => !v);
    this.isGearOpen.set(false);
    this.closeAllDropdowns();
  }
  openAvatar(): void {
    this.isAvatarOpen.set(true);
    this.cdr.markForCheck();
  }

  closeAvatar(): void {
    this.isAvatarOpen.set(false);
    this.cdr.markForCheck();
  }
  // ── Engranaje activo si algún sub-item de config está activo ──
  isGearActive(): boolean {
    return this.gearItems().some(child => this.isActive(child.id));
  }

  // ── Toggle engranaje ─────────────────────────
  toggleGear(event: Event): void {
    event.stopPropagation();
    this.isGearOpen.update(v => !v);
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
    this.isAvatarOpen.set(false);
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
      this.isAvatarOpen.set(false);
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

  // ── Notificaciones ───────────────────────────
  toggleNotif(event: Event): void {
    event.stopPropagation();
    this.isNotifOpen.update(v => !v);
    if (this.isNotifOpen()) {
      this.isGearOpen.set(false);
    }
  }

  navigateFromNotif(n: AppNotification): void {
    this.isNotifOpen.set(false);
    switch (n.type) {
      case 'solicitado':
        this.router.navigate(['/requisicion/confirmacion']);
        break;
      case 'autorizado':
      case 'listo_recoger':
      case 'entregado':
        this.router.navigate(['/requisicion', n.requisition_id]);
        break;
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next:  (r)   => console.log('Logout successful:', r.message),
      error: (err) => console.error('Logout error:', err)
    });
  }
}
