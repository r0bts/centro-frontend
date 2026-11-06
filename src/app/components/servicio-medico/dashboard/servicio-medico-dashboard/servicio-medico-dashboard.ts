import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, switchMap, catchError, finalize } from 'rxjs/operators';
import { Html5Qrcode } from 'html5-qrcode';
import { ContentMenu } from '../../../content-menu/content-menu';
import { AuthService } from '../../../../services/auth.service';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { MembresiaService } from '../../../../services/membresia.service';
import { UserService } from '../../../../services/user.service';

export type SpotlightMode = 'socio' | 'colaborador' | 'externo';

export interface UnifiedSearchResult {
  id: string | number;
  token: string;
  name: string;
  subtitle: string;
  email?: string;
  badge: string;
  type: SpotlightMode;
}

@Component({
  selector: 'app-servicio-medico-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContentMenu],
  templateUrl: './servicio-medico-dashboard.html',
  styleUrl: './servicio-medico-dashboard.scss'
})
export class ServicioMedicoDashboard implements OnInit, OnDestroy {
  @ViewChild('spotlightInput') spotlightInput?: ElementRef<HTMLInputElement>;

  // ── Spotlight iOS Buscador de Expedientes (Socios / Colaboradores / Externos) ──
  showSpotlight: boolean = false;
  spotlightMode: SpotlightMode = 'socio';
  spotlightSelectedIndex: number = 0;
  searchTerm: string = '';
  isSearching: boolean = false;
  hasSearched: boolean = false;
  unifiedResults: UnifiedSearchResult[] = [];
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Escáner QR integrado dentro de Spotlight
  isSpotlightCameraOpen: boolean = false;
  spotlightCameraError: string | null = null;
  private html5QrCode: Html5Qrcode | null = null;

  // Posición arrastrable (draggable) estilo Spotlight macOS con persistencia
  private readonly SPOTLIGHT_POS_KEY = 'sm_spotlight_pos_v1';
  spotlightOffsetX: number = 0;
  spotlightOffsetY: number = 0;
  isDraggingSpotlight: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private initialOffsetX: number = 0;
  private initialOffsetY: number = 0;

  // Datos Operativos
  isLoadingDashboard: boolean = true;
  skeletonRows: number[] = [1, 2, 3, 4];
  consultas: any[] = [];
  locations: any[] = [];

  // Filtro de la bandeja de consultas
  activeQueueTab: 'abiertas' | 'hoy' | 'recientes' = 'abiertas';
  patientTypeFilter: 'todos' | 'socio' | 'colaborador' | 'externo' = 'todos';

  constructor(
    private router: Router,
    private authService: AuthService,
    private servicioMedico: ServicioMedicoService,
    private membresiaService: MembresiaService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreSpotlightPosition();
    this.setupSpotlightSearch();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.stopSpotlightCamera();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSpotlight) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSpotlight();
      return;
    }

    if (this.unifiedResults.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.spotlightSelectedIndex = (this.spotlightSelectedIndex + 1) % this.unifiedResults.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.spotlightSelectedIndex =
          (this.spotlightSelectedIndex - 1 + this.unifiedResults.length) % this.unifiedResults.length;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const chosen = this.unifiedResults[this.spotlightSelectedIndex];
        if (chosen) {
          this.abrirExpediente(chosen);
        }
      }
    } else if (event.key === 'Enter' && this.spotlightMode === 'externo' && this.searchTerm.trim()) {
      event.preventDefault();
      this.openDirectQrToken(this.searchTerm.trim());
    }
  }

  loadDashboardData(): void {
    this.isLoadingDashboard = true;

    forkJoin({
      consultas: this.servicioMedico.getConsultas('', { limit: 60 }).pipe(catchError(() => of({ success: false, data: [] }))),
      locations: this.servicioMedico.getLocations().pipe(catchError(() => of({ success: false, data: [] })))
    })
      .pipe(
        finalize(() => {
          this.isLoadingDashboard = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(res => {
        if (res.consultas?.success && Array.isArray(res.consultas.data)) {
          this.consultas = res.consultas.data;
        }
        if (res.locations?.success) {
          const allLocs = res.locations.data?.locations || res.locations.data;
          this.locations = Array.isArray(allLocs) ? allLocs : [];
        }

        if (this.consultasAbiertas.length === 0) {
          this.activeQueueTab = this.consultasHoy.length > 0 ? 'hoy' : 'recientes';
        } else {
          this.activeQueueTab = 'abiertas';
        }
      });
  }

  // ── Arrastrar y fijar posición del Spotlight en pantalla ──────────────────
  private restoreSpotlightPosition(): void {
    try {
      const saved = localStorage.getItem(this.SPOTLIGHT_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          this.spotlightOffsetX = parsed.x;
          this.spotlightOffsetY = parsed.y;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  private saveSpotlightPosition(): void {
    try {
      localStorage.setItem(
        this.SPOTLIGHT_POS_KEY,
        JSON.stringify({ x: this.spotlightOffsetX, y: this.spotlightOffsetY })
      );
    } catch {
      // ignore storage errors
    }
  }

  startSpotlightDrag(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, a')) {
      return;
    }
    event.preventDefault();
    this.isDraggingSpotlight = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialOffsetX = this.spotlightOffsetX;
    this.initialOffsetY = this.spotlightOffsetY;
  }

  @HostListener('document:mousemove', ['$event'])
  onSpotlightMouseMove(event: MouseEvent): void {
    if (!this.isDraggingSpotlight) return;
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    this.spotlightOffsetX = this.initialOffsetX + dx;
    this.spotlightOffsetY = this.initialOffsetY + dy;
  }

  @HostListener('document:mouseup')
  onSpotlightMouseUp(): void {
    if (!this.isDraggingSpotlight) return;
    this.isDraggingSpotlight = false;
    this.saveSpotlightPosition();
  }

  resetSpotlightPosition(): void {
    this.spotlightOffsetX = 0;
    this.spotlightOffsetY = 0;
    this.saveSpotlightPosition();
  }

  // ── Spotlight iOS (Socios, Colaboradores y Externos) ──────────────────────
  openSpotlight(mode: SpotlightMode): void {
    this.spotlightMode = mode;
    this.showSpotlight = true;
    this.searchTerm = '';
    this.unifiedResults = [];
    this.hasSearched = false;
    this.isSearching = false;
    this.spotlightSelectedIndex = 0;
    this.stopSpotlightCamera();
    this.cdr.detectChanges();

    setTimeout(() => {
      this.spotlightInput?.nativeElement?.focus();
    }, 60);
  }

  switchSpotlightMode(mode: SpotlightMode): void {
    if (this.spotlightMode === mode) return;
    this.spotlightMode = mode;
    this.spotlightSelectedIndex = 0;
    this.unifiedResults = [];
    this.hasSearched = false;
    this.isSearching = false;
    this.stopSpotlightCamera();
    this.cdr.detectChanges();

    if (this.searchTerm.trim()) {
      this.searchSubject.next(this.searchTerm.trim());
    }

    setTimeout(() => {
      this.spotlightInput?.nativeElement?.focus();
    }, 40);
  }

  closeSpotlight(): void {
    this.stopSpotlightCamera();
    this.showSpotlight = false;
    this.searchTerm = '';
    this.unifiedResults = [];
    this.hasSearched = false;
    this.isSearching = false;
    this.spotlightSelectedIndex = 0;
  }

  get spotlightPlaceholder(): string {
    switch (this.spotlightMode) {
      case 'socio':
        return 'Buscar Socio por número de acción, nombre, apellido o correo...';
      case 'colaborador':
        return 'Buscar Colaborador por nombre, apellido, correo o número de empleado...';
      case 'externo':
        return 'Buscar Externo / Curso de Verano por nombre, teléfono o token QR...';
    }
  }

  private setupSpotlightSearch(): void {
    this.searchSub = this.searchSubject
      .pipe(
        debounceTime(240),
        switchMap(term => {
          const clean = (term || '').trim();

          // Detectar lectura de pistola QR de Socio (MEMBER:xxx:id)
          if (clean.startsWith('MEMBER:')) {
            const parts = clean.split(':');
            if (parts.length >= 3 && parts[2]) {
              this.closeSpotlight();
              this.router.navigate(['/servicio-medico/expediente', parts[2]], {
                queryParams: { source: 'dashboard', type: 'socio' }
              });
              return of(null);
            }
          }

          const isNumeric = /^\d+$/.test(clean);
          if (!clean || (!isNumeric && clean.length < 2)) {
            this.isSearching = false;
            this.hasSearched = false;
            this.unifiedResults = [];
            this.cdr.detectChanges();
            return of(null);
          }

          this.isSearching = true;
          this.hasSearched = true;
          this.cdr.detectChanges();

          if (this.spotlightMode === 'externo') {
            return this.servicioMedico.getProspectosExternos(clean).pipe(
              catchError(() => of({ success: false, data: [] }))
            );
          } else if (this.spotlightMode === 'socio') {
            return this.membresiaService.buscar(clean).pipe(catchError(() => of(null)));
          } else {
            return this.userService.getAllUsers(35, 1, clean).pipe(catchError(() => of([])));
          }
        })
      )
      .subscribe((res: any) => {
        this.isSearching = false;
        this.spotlightSelectedIndex = 0;

        if (!res) {
          this.cdr.detectChanges();
          return;
        }

        if (this.spotlightMode === 'socio') {
          const socios = res?.success && res?.data?.socios ? res.data.socios : [];
          this.unifiedResults = socios.map((s: any) => ({
            id: s.id,
            token: String(s.id),
            name: s.nombreCompleto || 'Socio',
            subtitle: `Acción #${s.numeroHumano || s.id} · ${s.parentesco || 'Socio'}`,
            email: s.email || '',
            badge: `Acción #${s.numeroHumano || s.id}`,
            type: 'socio' as SpotlightMode
          }));
        } else if (this.spotlightMode === 'colaborador') {
          const users = Array.isArray(res) ? res : [];
          this.unifiedResults = users.map((emp: any) => {
            const fn = (emp.firstName || emp.first_name || '').replace(/^Sin información$/i, '').trim();
            const ln = (emp.lastName || emp.last_name || '').replace(/^Sin información$/i, '').trim();
            const empNum = (emp.employeeNumber || emp.number_employee || '').toString().replace(/^Sin información$/i, '').trim();
            const email = (emp.email || '').replace(/^Sin información$/i, '').trim();
            const fullName = `${fn} ${ln}`.trim() || emp.username || `ID #${emp.id}`;
            const job = emp.departmentName || emp.jobdescription || emp.role || 'Personal Interno';
            return {
              id: emp.id,
              token: String(empNum || emp.id),
              name: fullName,
              subtitle: job,
              email,
              badge: empNum ? `Empleado #${empNum}` : `ID #${emp.id}`,
              type: 'colaborador' as SpotlightMode
            };
          });
        } else if (this.spotlightMode === 'externo') {
          const list = res?.success && Array.isArray(res.data) ? res.data : [];
          this.unifiedResults = list.slice(0, 25).map((p: any) => ({
            id: p.id,
            token: String(p.token || p.id),
            name: p.nombre_completo || p.nombre || 'Externo',
            subtitle: `${p.tipo === 'curso_verano' ? 'Curso de Verano' : 'Visitante / Externo'}${p.telefono ? ' · Tel: ' + p.telefono : (p.responsable ? ' · Resp: ' + p.responsable : '')}`,
            email: p.email || '',
            badge: p.badge || (p.tipo === 'curso_verano' ? 'Curso de Verano' : 'Externo'),
            type: 'externo' as SpotlightMode
          }));
        }

        this.cdr.detectChanges();
      });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next((value || '').trim());
  }

  clearSpotlightSearch(): void {
    this.searchTerm = '';
    this.unifiedResults = [];
    this.hasSearched = false;
    this.isSearching = false;
    this.spotlightInput?.nativeElement?.focus();
  }

  abrirExpediente(item: UnifiedSearchResult): void {
    this.closeSpotlight();
    if (item.type === 'socio') {
      this.router.navigate(['/servicio-medico/expediente', item.token], {
        queryParams: { source: 'dashboard', type: 'socio' }
      });
    } else if (item.type === 'colaborador') {
      this.router.navigate(['/servicio-medico/expediente', item.token], {
        queryParams: { source: 'dashboard', type: 'empleado' }
      });
    } else {
      this.router.navigate(['/servicio-medico/expediente', item.token], {
        queryParams: { source: 'dashboard' }
      });
    }
  }

  openDirectQrToken(rawToken: string): void {
    let token = rawToken.trim();
    if (token.startsWith('MEMBER:')) {
      const parts = token.split(':');
      if (parts.length >= 3) {
        this.closeSpotlight();
        this.router.navigate(['/servicio-medico/expediente', parts[2]], {
          queryParams: { source: 'dashboard', type: 'socio' }
        });
        return;
      }
    }
    if (token.includes('=')) {
      token = token.split('=').pop() || token;
    } else if (token.includes('/')) {
      token = token.split('/').pop() || token;
    }
    if (!token) return;
    this.closeSpotlight();
    this.router.navigate(['/servicio-medico/expediente', token], {
      queryParams: { source: 'dashboard' }
    });
  }

  toggleSpotlightCamera(): void {
    if (this.isSpotlightCameraOpen) {
      this.stopSpotlightCamera();
    } else {
      this.isSpotlightCameraOpen = true;
      this.spotlightCameraError = null;
      this.cdr.detectChanges();
      setTimeout(() => this.startSpotlightCamera(), 150);
    }
  }

  private startSpotlightCamera(): void {
    try {
      this.html5QrCode = new Html5Qrcode('sm-spotlight-qr-reader');
      const config = { fps: 10, qrbox: { width: 220, height: 220 } };
      this.html5QrCode
        .start(
          { facingMode: 'environment' },
          config,
          decodedText => {
            this.stopSpotlightCamera();
            this.openDirectQrToken(decodedText);
          },
          () => {}
        )
        .catch(() =>
          this.html5QrCode!.start(
            { facingMode: 'user' },
            config,
            decodedText => {
              this.stopSpotlightCamera();
              this.openDirectQrToken(decodedText);
            },
            () => {}
          )
        )
        .catch(() => {
          this.spotlightCameraError = 'No se pudo iniciar la cámara. Verifica los permisos del navegador o escribe el código arriba.';
          this.cdr.detectChanges();
        });
    } catch {
      this.spotlightCameraError = 'No se pudo inicializar el lector QR.';
      this.cdr.detectChanges();
    }
  }

  stopSpotlightCamera(): void {
    this.isSpotlightCameraOpen = false;
    if (this.html5QrCode) {
      const qr = this.html5QrCode;
      this.html5QrCode = null;
      if (qr.isScanning) {
        qr.stop().then(() => qr.clear()).catch(() => {});
      }
    }
  }

  abrirConsultaExistente(c: any): void {
    const queryParams: any = {
      consulta_id: c.id,
      source: 'visitas'
    };
    if (!this.isCursoVeranoToken(c) && (c.patient_type === 'socio' || c.is_socio)) {
      queryParams.type = 'socio';
    } else if (c.patient_type === 'empleado' || c.patient_type === 'colaborador') {
      queryParams.type = 'empleado';
    }
    this.router.navigate(['/servicio-medico/expediente', c.patient_token], { queryParams });
  }

  // ── Clasificación de Pacientes (Socios, Colaboradores, Externos / Curso de Verano) ──
  isCursoVeranoToken(c: any): boolean {
    const token = String(c?.patient_token || '').trim();
    return c?.patient_type === 'curso_verano' || (token.length > 0 && !/^\d+$/.test(token));
  }

  matchesPatientFilter(c: any, filter: 'todos' | 'socio' | 'colaborador' | 'externo'): boolean {
    if (filter === 'todos') return true;

    const isColab = c.patient_type === 'empleado' || c.patient_type === 'colaborador';
    if (filter === 'colaborador') {
      return isColab;
    }

    const isCursoVerano = this.isCursoVeranoToken(c);
    const isExternoOrInvitado = !c.is_socio || isCursoVerano || c.patient_type === 'invitado';

    if (filter === 'externo') {
      return !isColab && isExternoOrInvitado;
    }

    if (filter === 'socio') {
      // Incluye socios titulares/beneficiarios (y niños de curso de verano que son socios)
      return !isColab && Boolean(c.is_socio || c.patient_type === 'socio');
    }

    return true;
  }

  getPatientTypeLabel(c: any): string {
    if (c.patient_type === 'empleado' || c.patient_type === 'colaborador') {
      return 'Colaborador';
    }
    if (this.isCursoVeranoToken(c)) {
      return c.is_socio ? 'Curso de Verano · Socio' : 'Curso de Verano · Invitado';
    }
    if (c.patient_type === 'socio' || c.is_socio) {
      return 'Socio';
    }
    return 'Externo · Invitado';
  }

  // ── Contadores y Cola ──────────────────────────────────────────────────────
  private isSameLocalDay(dateVal: string | Date): boolean {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  get consultasHoy(): any[] {
    return this.consultas.filter(c => this.isSameLocalDay(c.created));
  }

  get consultasAbiertas(): any[] {
    return this.consultas.filter(c => c.status === 'abierta');
  }

  get displayedQueue(): any[] {
    let source: any[] = [];
    if (this.activeQueueTab === 'abiertas') {
      source = this.consultasAbiertas;
    } else if (this.activeQueueTab === 'hoy') {
      source = this.consultasHoy;
    } else {
      source = this.consultas;
    }

    if (this.patientTypeFilter !== 'todos') {
      source = source.filter(c => this.matchesPatientFilter(c, this.patientTypeFilter));
    }

    return source.slice(0, 6);
  }

  getLocationName(id: string | number | null | undefined): string {
    if (!id) return 'Consultorio Central';
    const loc = this.locations.find(l => String(l.id) === String(id));
    return loc ? loc.name : `Consultorio #${id}`;
  }

  getInitials(name: string): string {
    if (!name) return 'SM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  navigateTo(path: string): void {
    this.router.navigate([`/servicio-medico/${path}`]);
  }

  hasAccess(submodule: string): boolean {
    return this.authService.hasAnyPermission(submodule, ['view', 'create', 'update', 'delete']);
  }
}
