import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ContentMenu } from '../../../content-menu/content-menu';
import { ServicioMedicoService } from '../../../../services/servicio-medico';
import { MembresiaService } from '../../../../services/membresia.service';
import { UserService } from '../../../../services/user.service';

export type PreregistroTab = 'en_revision' | 'pendiente' | 'sincronizado' | 'rechazado' | 'expirado' | 'cancelado';
export type DestinatarioType = 'socio' | 'empleado' | 'prospecto_socio' | 'prospecto_empleado' | 'externo';

@Component({
  selector: 'app-servicio-medico-preregistros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContentMenu],
  templateUrl: './servicio-medico-preregistros.html',
  styleUrl: './servicio-medico-preregistros.scss'
})
export class ServicioMedicoPreregistros implements OnInit, AfterViewInit, OnDestroy {
  private readonly COUNTS_CACHE_KEY = 'sm_prereg_counts_v1';
  isLoading: boolean = true;
  hasCachedCounts: boolean = false;
  skeletonRows: number[] = [1, 2];

  activeTab: PreregistroTab = 'en_revision';
  searchQuery: string = '';

  readonly tabsList: { key: PreregistroTab; label: string }[] = [
    { key: 'en_revision', label: 'En revisión' },
    { key: 'pendiente', label: 'Pendientes (no enviados)' },
    { key: 'sincronizado', label: 'Sincronizados' },
    { key: 'rechazado', label: 'Rechazados' },
    { key: 'expirado', label: 'Expirados' },
    { key: 'cancelado', label: 'Cancelados' }
  ];

  @ViewChildren('tabBtn') tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;
  gliderLeft: number = 0;
  gliderWidth: number = 0;
  gliderReady: boolean = false;
  tabSlideClass: string = 'sm-slide-in-right';

  allItems: any[] = [];
  counts: Record<PreregistroTab, number> = {
    en_revision: 0,
    pendiente: 0,
    sincronizado: 0,
    rechazado: 0,
    expirado: 0,
    cancelado: 0
  };

  // ── Modal: Generar cuestionario ───────────────────────────────────────────
  showGenerateModal: boolean = false;
  isGenerating: boolean = false;
  genTipo: DestinatarioType = 'socio';
  genVigenciaHoras: number = 72;
  genQuestionnaireVariant: 'completo' | 'pvme_nom036' = 'completo';

  // Buscador de Socio / Colaborador para Generar
  entitySearchTerm: string = '';
  isSearchingEntities: boolean = false;
  entityResults: any[] = [];
  selectedEntity: any = null;
  private entitySearchSubject = new Subject<string>();
  private entitySearchSub?: Subscription;

  // Campos de Prospecto / Externo
  externoMode: 'nuevo' | 'existente' = 'nuevo';
  existingExternos: any[] = [];
  selectedProspectoId: number | null = null;
  genNombre: string = '';
  genEmail: string = '';
  genTelefono: string = '';
  genTelefonoAlterno: string = '';
  genFechaNacimiento: string = '';
  genTipoExterno: 'visitante' | 'invitado' | 'curso_verano' | 'otro' = 'invitado';
  genResponsableNombre: string = '';
  genNotas: string = '';

  // Resultado tras generar
  generatedResult: {
    id: number;
    token: string;
    public_url: string;
    email_sent: boolean;
    expira_at: string;
  } | null = null;

  // ── Modal: Detalle y Revisión Clínica ─────────────────────────────────────
  selectedItem: any = null;
  notasRevisionInput: string = '';
  isProcessingAction: boolean = false;

  // Vincular prospecto a NetSuite dentro del modal de revisión
  linkTargetType: 'socio' | 'empleado' = 'empleado';
  linkSearchTerm: string = '';
  isSearchingLink: boolean = false;
  linkResults: any[] = [];
  selectedLinkTarget: any = null;
  private linkSearchSubject = new Subject<string>();
  private linkSearchSub?: Subscription;

  constructor(
    private servicioMedico: ServicioMedicoService,
    private membresiaService: MembresiaService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreCachedCounts();
    this.setupEntitySearch();
    this.setupLinkSearch();
    this.loadPreregistros();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateTabGlider(), 10);
  }

  ngOnDestroy(): void {
    this.entitySearchSub?.unsubscribe();
    this.linkSearchSub?.unsubscribe();
  }

  private restoreCachedCounts(): void {
    try {
      const raw = sessionStorage.getItem(this.COUNTS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.counts = { ...this.counts, ...parsed };
          this.hasCachedCounts = true;
          this.syncSkeletonRowsWithActiveTab();
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  private syncSkeletonRowsWithActiveTab(): void {
    const activeCount = this.counts[this.activeTab];
    if (this.hasCachedCounts) {
      const targetRows = activeCount > 0 ? Math.min(activeCount, 15) : 0;
      this.skeletonRows = Array.from({ length: targetRows }, (_, i) => i + 1);
    } else {
      this.skeletonRows = [1, 2];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGA Y FILTRADO DE BANDEJA
  // ═══════════════════════════════════════════════════════════════════════════
  loadPreregistros(silent: boolean = false): void {
    if (!silent) {
      this.syncSkeletonRowsWithActiveTab();
      this.isLoading = true;
    }

    this.servicioMedico.getPreregistros()
      .pipe(
        catchError(() => of({ success: false, data: { items: [], counts: {} } })),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.updateTabGlider(), 20);
        })
      )
      .subscribe(res => {
        if (res?.success && res.data) {
          this.allItems = Array.isArray(res.data.items) ? res.data.items : [];
          if (res.data.counts) {
            this.counts = {
              en_revision: res.data.counts.en_revision || 0,
              pendiente: res.data.counts.pendiente || 0,
              sincronizado: res.data.counts.sincronizado || 0,
              rechazado: res.data.counts.rechazado || 0,
              expirado: res.data.counts.expirado || 0,
              cancelado: res.data.counts.cancelado || 0
            };
            this.hasCachedCounts = true;
            this.syncSkeletonRowsWithActiveTab();
            try {
              sessionStorage.setItem(this.COUNTS_CACHE_KEY, JSON.stringify(this.counts));
            } catch {
              // ignore storage errors
            }
          }
          setTimeout(() => this.updateTabGlider(), 20);
          // Actualizar item seleccionado si el modal sigue abierto
          if (this.selectedItem) {
            const updated = this.allItems.find(x => x.id === this.selectedItem.id);
            if (updated) {
              this.selectedItem = updated;
            }
          }
        }
      });
  }

  setTab(tab: PreregistroTab): void {
    if (this.activeTab === tab) return;
    const prevIdx = this.tabsList.findIndex(t => t.key === this.activeTab);
    const nextIdx = this.tabsList.findIndex(t => t.key === tab);
    const dir = nextIdx >= prevIdx ? 'right' : 'left';

    this.tabSlideClass = '';
    this.activeTab = tab;
    this.syncSkeletonRowsWithActiveTab();
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      this.tabSlideClass = dir === 'right' ? 'sm-slide-in-right' : 'sm-slide-in-left';
      this.updateTabGlider();
      this.cdr.detectChanges();
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateTabGlider();
  }

  updateTabGlider(): void {
    if (!this.tabButtons || this.tabButtons.length === 0) return;
    const idx = this.tabsList.findIndex(t => t.key === this.activeTab);
    const btnRef = this.tabButtons.get(idx >= 0 ? idx : 0);
    if (btnRef?.nativeElement) {
      const el = btnRef.nativeElement;
      this.gliderLeft = el.offsetLeft;
      this.gliderWidth = el.offsetWidth;
      this.gliderReady = true;
      this.cdr.detectChanges();
    }
  }

  get filteredItems(): any[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    return this.allItems.filter(item => {
      if (item.estado !== this.activeTab) return false;
      if (!q) return true;
      const nombre = (item.destinatario_nombre || '').toLowerCase();
      const email = (item.email_destino || '').toLowerCase();
      const cred = (item.destinatario_credencial || '').toLowerCase();
      const tipo = (item.tipo_label || '').toLowerCase();
      return nombre.includes(q) || email.includes(q) || cred.includes(q) || tipo.includes(q);
    });
  }

  get tabSubtitle(): string {
    switch (this.activeTab) {
      case 'en_revision':
        return 'Cuestionarios contestados, pendientes de aprobación clínica para sincronizar a NetSuite.';
      case 'pendiente':
        return 'Ligas generadas y activas en espera de que el destinatario responda y envíe su cuestionario.';
      case 'sincronizado':
        return 'Cuestionarios aprobados clínicamente y transmitidos a NetSuite y al expediente médico.';
      case 'rechazado':
        return 'Cuestionarios rechazados durante la revisión clínica con motivo registrado.';
      case 'expirado':
        return 'Ligas cuya vigencia expiró o fueron reemplazadas por una nueva liga.';
      case 'cancelado':
        return 'Ligas canceladas manualmente por el personal médico o administrativo.';
    }
  }

  getPublicLink(token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
    return `${origin}/cuestionario/${token}`;
  }

  copyLink(token: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const url = this.getPublicLink(token);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
    }
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Liga copiada al portapapeles',
      text: url,
      showConfirmButton: false,
      timer: 2200
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL: GENERAR CUESTIONARIO
  // ═══════════════════════════════════════════════════════════════════════════
  openGenerateModal(): void {
    this.showGenerateModal = true;
    this.generatedResult = null;
    this.selectGenTipo('socio');
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
    this.generatedResult = null;
  }

  selectGenTipo(tipo: DestinatarioType): void {
    this.genTipo = tipo;
    this.entitySearchTerm = '';
    this.entityResults = [];
    this.selectedEntity = null;
    this.selectedProspectoId = null;
    this.genNombre = '';
    this.genEmail = '';
    this.genTelefono = '';
    this.genTelefonoAlterno = '';
    this.genFechaNacimiento = '';
    this.genTipoExterno = 'invitado';
    this.genResponsableNombre = '';
    this.genNotas = '';
    this.genQuestionnaireVariant = 'completo';
    this.generatedResult = null;

    if (tipo === 'externo') {
      this.loadExistingExternos();
    }
  }

  private loadExistingExternos(): void {
    this.servicioMedico.getProspectosExternos().pipe(catchError(() => of({ success: false, data: [] }))).subscribe(res => {
      if (res?.success && Array.isArray(res.data)) {
        this.existingExternos = res.data;
      }
      this.cdr.detectChanges();
    });
  }

  private formatEmployeeOption(u: any): { id: any; name: string; credential: string; subtitle: string; email: string } {
    const fn = (u.firstName || u.first_name || '').replace(/^Sin información$/i, '').trim();
    const ln = (u.lastName || u.last_name || '').replace(/^Sin información$/i, '').trim();
    const empNum = (u.employeeNumber || u.number_employee || '').toString().replace(/^Sin información$/i, '').trim();
    const fullName = `${fn} ${ln}`.trim() || u.username || `ID #${u.id}`;
    return {
      id: u.id,
      name: fullName,
      credential: empNum ? `Empleado #${empNum}` : `ID #${u.id}`,
      subtitle: u.departmentName || u.department?.name || u.jobdescription || 'Colaborador',
      email: (u.email || '').replace(/^Sin información$/i, '').trim()
    };
  }

  private setupEntitySearch(): void {
    this.entitySearchSub = this.entitySearchSubject.pipe(
      debounceTime(250),
      switchMap(term => {
        const clean = (term || '').trim();
        const isNumeric = /^\d+$/.test(clean);
        if (!clean || (!isNumeric && clean.length < 2)) {
          this.isSearchingEntities = false;
          this.entityResults = [];
          this.cdr.detectChanges();
          return of(null);
        }
        this.isSearchingEntities = true;
        this.cdr.detectChanges();

        if (this.genTipo === 'socio') {
          return this.membresiaService.buscar(clean).pipe(catchError(() => of(null)));
        } else if (this.genTipo === 'empleado') {
          return this.userService.getAllUsers(50, 1, clean).pipe(catchError(() => of([])));
        }
        return of(null);
      })
    ).subscribe((res: any) => {
      this.isSearchingEntities = false;
      if (this.genTipo === 'socio') {
        const socios = res?.success && res?.data?.socios ? res.data.socios : [];
        this.entityResults = socios.map((s: any) => ({
          id: s.id,
          name: s.nombreCompleto,
          credential: `Acción #${s.numeroHumano || s.id}`,
          subtitle: s.parentesco || 'Socio',
          email: s.email || ''
        }));
      } else if (this.genTipo === 'empleado') {
        const users = Array.isArray(res) ? res : [];
        this.entityResults = users.map((u: any) => this.formatEmployeeOption(u));
      }
      this.cdr.detectChanges();
    });
  }

  onEntitySearchChange(val: string): void {
    this.entitySearchTerm = val;
    this.entitySearchSubject.next(val);
  }

  selectEntityForGenerate(ent: any): void {
    this.selectedEntity = ent;
    this.genEmail = ent.email || '';
    this.entityResults = [];
  }

  clearSelectedEntity(): void {
    this.selectedEntity = null;
    this.entitySearchTerm = '';
    this.entityResults = [];
  }

  submitGenerate(): void {
    if (this.isGenerating) return;

    const payload: any = {
      tipo_destinatario: this.genTipo,
      vigencia_horas: this.genVigenciaHoras || 72,
      email_destino: (this.genEmail || '').trim()
    };

    if (this.genTipo === 'socio') {
      if (!this.selectedEntity?.id) {
        Swal.fire('Atención', 'Selecciona un Socio de la lista de resultados.', 'warning');
        return;
      }
      payload.socio_id = this.selectedEntity.id;
    } else if (this.genTipo === 'empleado') {
      if (!this.selectedEntity?.id) {
        Swal.fire('Atención', 'Selecciona un Colaborador de la lista de resultados.', 'warning');
        return;
      }
      payload.empleado_id = this.selectedEntity.id;
      payload.questionnaire_variant = this.genQuestionnaireVariant;
    } else if (this.genTipo === 'prospecto_socio' || this.genTipo === 'prospecto_empleado') {
      if (!this.genNombre.trim() || !this.genEmail.trim()) {
        Swal.fire('Atención', 'Nombre completo y correo electrónico son obligatorios.', 'warning');
        return;
      }
      payload.nombre = this.genNombre.trim();
      payload.telefono = this.genTelefono.trim();
      payload.notas = this.genNotas.trim();
      if (this.genTipo === 'prospecto_empleado') {
        payload.questionnaire_variant = this.genQuestionnaireVariant;
      }
    } else if (this.genTipo === 'externo') {
      if (this.externoMode === 'existente') {
        if (!this.selectedProspectoId) {
          Swal.fire('Atención', 'Selecciona un invitado registrado de la lista.', 'warning');
          return;
        }
        payload.prospecto_id = this.selectedProspectoId;
      } else {
        if (!this.genNombre.trim() || !this.genEmail.trim()) {
          Swal.fire('Atención', 'Nombre completo y correo electrónico son obligatorios.', 'warning');
          return;
        }
        if (this.genTipoExterno === 'curso_verano' && (!this.genFechaNacimiento || !this.genResponsableNombre.trim())) {
          Swal.fire('Atención', 'Para Curso de Verano, la fecha de nacimiento y el nombre del padre/tutor responsable son obligatorios.', 'warning');
          return;
        }
        payload.nombre = this.genNombre.trim();
        payload.telefono = this.genTelefono.trim();
        payload.telefono_alterno = this.genTelefonoAlterno.trim();
        payload.fecha_nacimiento = this.genFechaNacimiento;
        payload.tipo_externo = this.genTipoExterno;
        payload.responsable_nombre = this.genResponsableNombre.trim();
        payload.notas = this.genNotas.trim();
      }
    }

    this.isGenerating = true;
    this.servicioMedico.generatePreregistro(payload)
      .pipe(
        finalize(() => {
          this.isGenerating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.generatedResult = res.data;
            this.loadPreregistros(true);
          } else {
            Swal.fire('Error', res?.message || 'No se pudo generar el cuestionario.', 'error');
          }
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo generar el cuestionario.', 'error');
        }
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL: DETALLE Y REVISIÓN CLÍNICA
  // ═══════════════════════════════════════════════════════════════════════════
  openDetailModal(item: any): void {
    this.selectedItem = item;
    this.notasRevisionInput = item.notas_revision || '';
    this.linkSearchTerm = '';
    this.linkResults = [];
    this.linkTargetType = (item.tipo_destinatario === 'prospecto_socio' || item.socio_id) ? 'socio' : 'empleado';

    if (item.prospecto_id && (item.socio_id || item.empleado_id)) {
      this.selectedLinkTarget = {
        id: item.socio_id || item.empleado_id,
        name: item.destinatario_nombre,
        credential: item.destinatario_credencial
      };
    } else {
      this.selectedLinkTarget = null;
    }
  }

  closeDetailModal(): void {
    this.selectedItem = null;
    this.notasRevisionInput = '';
  }

  get isProspectoLinkable(): boolean {
    if (!this.selectedItem) return false;
    return !!this.selectedItem.prospecto_id && this.selectedItem.estado !== 'sincronizado';
  }

  get isUnlinkedProspecto(): boolean {
    if (!this.selectedItem) return false;
    return !this.selectedItem.socio_id && !this.selectedItem.empleado_id && !!this.selectedItem.prospecto_id;
  }

  private setupLinkSearch(): void {
    this.linkSearchSub = this.linkSearchSubject.pipe(
      debounceTime(250),
      switchMap(term => {
        const clean = (term || '').trim();
        const isNumeric = /^\d+$/.test(clean);
        if (!clean || (!isNumeric && clean.length < 2)) {
          this.isSearchingLink = false;
          this.linkResults = [];
          this.cdr.detectChanges();
          return of(null);
        }
        this.isSearchingLink = true;
        this.cdr.detectChanges();

        if (this.linkTargetType === 'socio') {
          return this.membresiaService.buscar(clean).pipe(catchError(() => of(null)));
        } else {
          return this.userService.getAllUsers(50, 1, clean).pipe(catchError(() => of([])));
        }
      })
    ).subscribe((res: any) => {
      this.isSearchingLink = false;
      if (this.linkTargetType === 'socio') {
        const socios = res?.success && res?.data?.socios ? res.data.socios : [];
        this.linkResults = socios.map((s: any) => ({
          id: s.id,
          name: s.nombreCompleto,
          credential: `Acción #${s.numeroHumano || s.id}`,
          email: s.email || s.correo || ''
        }));
      } else {
        const users = Array.isArray(res) ? res : [];
        this.linkResults = users.map((u: any) => this.formatEmployeeOption(u));
      }
      this.cdr.detectChanges();
    });
  }

  onLinkSearchChange(val: string): void {
    this.linkSearchTerm = val;
    this.linkSearchSubject.next(val);
  }

  selectLinkEntity(ent: any): void {
    this.selectedLinkTarget = ent;
    this.linkResults = [];
    this.linkSearchTerm = '';

    if (!this.selectedItem) return;
    const payload = this.linkTargetType === 'socio'
      ? { socio_id: ent.id }
      : { empleado_id: ent.id };

    this.servicioMedico.linkProspectoPreregistro(this.selectedItem.id, payload).subscribe({
      next: () => {
        if (this.linkTargetType === 'socio') {
          this.selectedItem.socio_id = ent.id;
          this.selectedItem.empleado_id = null;
        } else {
          this.selectedItem.empleado_id = ent.id;
          this.selectedItem.socio_id = null;
        }
        this.loadPreregistros(true);
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'No se pudo guardar la vinculación local.', 'error');
      }
    });
  }

  confirmLinkProspecto(): void {
    if (!this.selectedItem || !this.selectedLinkTarget) return;
    this.isProcessingAction = true;

    const payload = this.linkTargetType === 'socio'
      ? { socio_id: this.selectedLinkTarget.id }
      : { empleado_id: this.selectedLinkTarget.id };

    this.servicioMedico.linkProspectoPreregistro(this.selectedItem.id, payload)
      .pipe(finalize(() => {
        this.isProcessingAction = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          Swal.fire('Vinculado', res?.message || 'Prospecto vinculado correctamente.', 'success');
          this.selectedLinkTarget = null;
          this.linkSearchTerm = '';
          this.loadPreregistros(true);
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo vincular el prospecto.', 'error');
        }
      });
  }

  approveAndSync(): void {
    if (!this.selectedItem || this.isProcessingAction) return;

    if (this.isUnlinkedProspecto && !this.selectedLinkTarget) {
      Swal.fire(
        'Vinculación requerida',
        'Selecciona primero al Socio o Colaborador en el buscador superior para poder aprobar y sincronizar a NetSuite.',
        'warning'
      );
      return;
    }

    this.isProcessingAction = true;

    const doApprove$ = this.servicioMedico.approvePreregistro(this.selectedItem.id, {
      notas_revision: this.notasRevisionInput
    });

    const flow$ = (this.isUnlinkedProspecto && this.selectedLinkTarget)
      ? this.servicioMedico.linkProspectoPreregistro(
          this.selectedItem.id,
          this.linkTargetType === 'socio'
            ? { socio_id: this.selectedLinkTarget.id }
            : { empleado_id: this.selectedLinkTarget.id }
        ).pipe(switchMap(() => doApprove$))
      : doApprove$;

    flow$
      .pipe(finalize(() => {
        this.isProcessingAction = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          Swal.fire('Sincronizado', res?.message || 'Vinculado, aprobado y sincronizado con NetSuite.', 'success');
          this.closeDetailModal();
          this.loadPreregistros(true);
        },
        error: (err) => {
          Swal.fire('Error al sincronizar', err?.error?.message || 'Ocurrió un error al enviar a NetSuite.', 'error');
          this.loadPreregistros(true);
        }
      });
  }

  rejectCurrent(): void {
    if (!this.selectedItem || this.isProcessingAction) return;
    const notas = (this.notasRevisionInput || '').trim();
    if (notas.length < 3) {
      Swal.fire('Motivo obligatorio', 'Escribe en las notas de revisión el motivo del rechazo (mínimo 3 caracteres).', 'warning');
      return;
    }

    this.isProcessingAction = true;
    this.servicioMedico.rejectPreregistro(this.selectedItem.id, { notas_revision: notas })
      .pipe(finalize(() => {
        this.isProcessingAction = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          Swal.fire('Rechazado', res?.message || 'El cuestionario fue marcado como rechazado.', 'success');
          this.closeDetailModal();
          this.loadPreregistros(true);
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo rechazar el cuestionario.', 'error');
        }
      });
  }

  cancelItem(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    Swal.fire({
      title: '¿Cancelar preregistro?',
      text: `Se invalidará la liga de ${item.destinatario_nombre}.`,
      input: 'text',
      inputPlaceholder: 'Motivo de cancelación (opcional)',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#334155'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.servicioMedico.cancelPreregistro(item.id, { notas_revision: result.value || 'Cancelado por staff' })
        .subscribe({
          next: () => {
            if (this.selectedItem?.id === item.id) {
              this.closeDetailModal();
            }
            this.loadPreregistros(true);
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'No se pudo cancelar.', 'error');
          }
        });
    });
  }

  reopenItem(item: any): void {
    if (this.isProcessingAction) return;
    this.isProcessingAction = true;
    this.servicioMedico.reopenPreregistro(item.id)
      .pipe(finalize(() => {
        this.isProcessingAction = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          Swal.fire('Reabierto', res?.message || 'El registro regresó a la cola En revisión.', 'success');
          this.activeTab = 'en_revision';
          this.loadPreregistros(true);
        },
        error: (err) => {
          Swal.fire('Error', err?.error?.message || 'No se pudo reabrir el preregistro.', 'error');
        }
      });
  }

  resendEmail(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.servicioMedico.resendPreregistroEmail(item.id).subscribe({
      next: (res) => {
        Swal.fire('Notificación', res?.message || 'Correo reenviado.', 'success');
        this.loadPreregistros(true);
      },
      error: (err) => {
        Swal.fire('Atención', err?.error?.message || 'No se pudo reenviar el correo.', 'warning');
      }
    });
  }

  formatArrayOrString(val: any): string {
    if (!val) return '—';
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '—';
    }
    return String(val);
  }
}
