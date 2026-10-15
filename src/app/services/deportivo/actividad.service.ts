import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Observable, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import {
  Actividad,
  ActividadListResponse,
  ActividadResponse,
  ActividadFormDataResponse,
  GrupoCategoriaResponse,
  EquipoResponse,
  CriterioResponse,
  HorarioResponse,
  CreateActividadRequest,
  UpdateActividadRequest,
  CreateGrupoRequest,
  CreateEquipoRequest,
  CreateCriterioRequest,
  CreateHorarioRequest,
  SemanaTipoPlantilla,
  SemanaTipoFranja,
} from '../../models/deportivo/actividad.model';

export const DEFAULT_SEMANAS_TIPO: SemanaTipoPlantilla[] = [
  {
    id: 1,
    nombre: 'Semana Otoño / Escolar (Lu–Ju Vespertino)',
    temporada: 'otono',
    descripcion: 'Patrón principal del club: Lunes a Jueves de 04:00 p.m. a 07:00 p.m.',
    dias: [1, 2, 3, 4],
    franjas: [
      { hora_inicio: '16:00', hora_fin: '17:00' },
      { hora_inicio: '17:00', hora_fin: '18:00' },
      { hora_inicio: '18:00', hora_fin: '19:00' },
    ],
  },
  {
    id: 2,
    nombre: 'Semana Verano (Intensiva Lu–Vi Matutino)',
    temporada: 'verano',
    descripcion: 'Lunes a Viernes de 09:00 a.m. a 01:00 p.m.',
    dias: [1, 2, 3, 4, 5],
    franjas: [
      { hora_inicio: '09:00', hora_fin: '13:00' },
    ],
  },
  {
    id: 3,
    nombre: 'Semana Invierno (Lu–Ju Compacto)',
    temporada: 'invierno',
    descripcion: 'Lunes a Jueves de 04:00 p.m. a 06:00 p.m.',
    dias: [1, 2, 3, 4],
    franjas: [
      { hora_inicio: '16:00', hora_fin: '17:00' },
      { hora_inicio: '17:00', hora_fin: '18:00' },
    ],
  },
  {
    id: 4,
    nombre: 'Semana Primavera (Lu–Ju Tarde Extendida)',
    temporada: 'primavera',
    descripcion: 'Lunes a Jueves de 02:00 p.m. a 06:00 p.m.',
    dias: [1, 2, 3, 4],
    franjas: [
      { hora_inicio: '14:00', hora_fin: '15:00' },
      { hora_inicio: '15:00', hora_fin: '16:00' },
      { hora_inicio: '16:00', hora_fin: '17:00' },
      { hora_inicio: '17:00', hora_fin: '18:00' },
    ],
  },
  {
    id: 5,
    nombre: 'Semana Terciada A (Lu y Mi Vespertino)',
    temporada: 'general',
    descripcion: 'Lunes y Miércoles de 04:00 p.m. a 06:00 p.m.',
    dias: [1, 3],
    franjas: [
      { hora_inicio: '16:00', hora_fin: '17:00' },
      { hora_inicio: '17:00', hora_fin: '18:00' },
    ],
  },
  {
    id: 6,
    nombre: 'Semana Terciada B (Ma y Ju Vespertino)',
    temporada: 'general',
    descripcion: 'Martes y Jueves de 04:00 p.m. a 06:00 p.m.',
    dias: [2, 4],
    franjas: [
      { hora_inicio: '16:00', hora_fin: '17:00' },
      { hora_inicio: '17:00', hora_fin: '18:00' },
    ],
  },
  {
    id: 7,
    nombre: 'Semana Fin de Semana (Sá y Do Matutino)',
    temporada: 'general',
    descripcion: 'Sábado y Domingo de 09:00 a.m. a 11:00 a.m.',
    dias: [6, 7],
    franjas: [
      { hora_inicio: '09:00', hora_fin: '10:00' },
      { hora_inicio: '10:00', hora_fin: '11:00' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly base = `${environment.apiUrl}/deportivo`;
  private readonly localStorageKey = 'cl_semanas_tipo_custom_v1';

  constructor(private http: HttpClient) {}

  // ── Actividades ─────────────────────────────────────────────────────────────

  private formDataCache$: Observable<ActividadFormDataResponse> | null = null;

  getFormData(forceRefresh = false): Observable<ActividadFormDataResponse> {
    if (!this.formDataCache$ || forceRefresh) {
      this.formDataCache$ = this.http.get<ActividadFormDataResponse>(`${this.base}/actividades/form-data`).pipe(
        shareReplay(1)
      );
    }
    return this.formDataCache$;
  }

  getAll(filters: { club_id?: number; activa?: boolean } = {}): Observable<ActividadListResponse> {
    let params = new HttpParams();
    if (filters.club_id) params = params.set('club_id', filters.club_id);
    if (filters.activa !== undefined) params = params.set('activa', filters.activa ? '1' : '0');
    return this.http.get<ActividadListResponse>(`${this.base}/actividades`, { params });
  }

  getById(id: number): Observable<ActividadResponse> {
    return this.http.get<ActividadResponse>(`${this.base}/actividades/${id}`);
  }

  create(data: CreateActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.base}/actividades`, data);
  }

  duplicate(id: number): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.base}/actividades/${id}/duplicate`, {});
  }

  update(id: number, data: UpdateActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.base}/actividades/${id}`, data);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/actividades/${id}`);
  }

  toggleActive(id: number, is_active: boolean): Observable<ActividadResponse> {
    return this.update(id, { is_active });
  }

  // ── Grupos / Categorías ─────────────────────────────────────────────────────

  createGrupo(data: CreateGrupoRequest): Observable<GrupoCategoriaResponse> {
    return this.http.post<GrupoCategoriaResponse>(`${this.base}/grupos-categorias`, data);
  }

  updateGrupo(id: number, data: Partial<CreateGrupoRequest>): Observable<GrupoCategoriaResponse> {
    return this.http.put<GrupoCategoriaResponse>(`${this.base}/grupos-categorias/${id}`, data);
  }

  deleteGrupo(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/grupos-categorias/${id}`);
  }

  // ── Equipos ─────────────────────────────────────────────────────────────────

  createEquipo(data: CreateEquipoRequest): Observable<EquipoResponse> {
    return this.http.post<EquipoResponse>(`${this.base}/equipos`, data);
  }

  updateEquipo(id: number, data: Partial<CreateEquipoRequest>): Observable<EquipoResponse> {
    return this.http.put<EquipoResponse>(`${this.base}/equipos/${id}`, data);
  }

  deleteEquipo(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/equipos/${id}`);
  }

  // ── Horarios ────────────────────────────────────────────────────────────────

  createHorario(equipoId: number, data: CreateHorarioRequest): Observable<HorarioResponse> {
    return this.http.post<HorarioResponse>(`${this.base}/equipos/${equipoId}/horarios`, data);
  }

  updateHorario(equipoId: number, horarioId: number, data: Partial<CreateHorarioRequest>): Observable<HorarioResponse> {
    return this.http.put<HorarioResponse>(`${this.base}/equipos/${equipoId}/horarios/${horarioId}`, data);
  }

  deleteHorario(equipoId: number, horarioId: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/equipos/${equipoId}/horarios/${horarioId}`);
  }

  // ── Mantenimiento Masivo y Excel ────────────────────────────────────────────

  bulkUpdate(items: any[]): Observable<{ success: boolean; message: string; data?: { updated: number; warnings: string[] } }> {
    return this.http.post<{ success: boolean; message: string; data?: { updated: number; warnings: string[] } }>(
      `${this.base}/actividades/bulk-update`,
      { items }
    );
  }

  exportExcel(filters: { club_id?: number | null; profesor_id?: number | null; q?: string } = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.club_id) params = params.set('club_id', String(filters.club_id));
    if (filters.profesor_id) params = params.set('profesor_id', String(filters.profesor_id));
    if (filters.q) params = params.set('q', filters.q);
    return this.http.get(`${this.base}/actividades/export-excel`, {
      params,
      responseType: 'blob',
    });
  }

  importExcel(file: File): Observable<{ success: boolean; message: string; data?: { updated: number; warnings: string[] } }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ success: boolean; message: string; data?: { updated: number; warnings: string[] } }>(
      `${this.base}/actividades/import-excel`,
      fd
    );
  }

  // ── Criterios de Evaluación ─────────────────────────────────────────────────

  createCriterio(data: CreateCriterioRequest): Observable<CriterioResponse> {
    return this.http.post<CriterioResponse>(`${this.base}/criterios-evaluacion`, data);
  }

  updateCriterio(id: number, data: Partial<CreateCriterioRequest>): Observable<CriterioResponse> {
    return this.http.put<CriterioResponse>(`${this.base}/criterios-evaluacion/${id}`, data);
  }

  deleteCriterio(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.base}/criterios-evaluacion/${id}`);
  }

  // ── Semanas Tipo (Plantillas de Horarios) ───────────────────────────────────

  getSemanasTipoList(fromFormData?: SemanaTipoPlantilla[]): SemanaTipoPlantilla[] {
    if (fromFormData && fromFormData.length > 0) {
      this.saveLocalSemanasTipo(fromFormData);
      return fromFormData;
    }
    try {
      const raw = localStorage.getItem(this.localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SEMANAS_TIPO.map(s => ({
      ...s,
      dias: [...s.dias],
      franjas: s.franjas.map(f => ({ ...f })),
    }));
  }

  private saveLocalSemanasTipo(list: SemanaTipoPlantilla[]): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(list));
    } catch {}
  }

  async persistSemanaTipo(
    payload: Omit<SemanaTipoPlantilla, 'id'>,
    id?: number | null,
    currentList?: SemanaTipoPlantilla[]
  ): Promise<SemanaTipoPlantilla[]> {
    try {
      const req$ = id
        ? this.http.put<{ success: boolean; data: { semanas_tipo: SemanaTipoPlantilla[] } }>(
            `${this.base}/actividades/semanas-tipo/${id}`,
            payload
          )
        : this.http.post<{ success: boolean; data: { semanas_tipo: SemanaTipoPlantilla[] } }>(
            `${this.base}/actividades/semanas-tipo`,
            payload
          );
      const res = await firstValueFrom(req$);
      this.formDataCache$ = null;
      const updated = res?.data?.semanas_tipo || [];
      if (updated.length > 0) {
        this.saveLocalSemanasTipo(updated);
        return updated;
      }
    } catch {}

    // Fallback local si el endpoint aún no está disponible
    const list = [...(currentList || this.getSemanasTipoList())];
    if (id) {
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload, id };
      }
    } else {
      const nextId = list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
      list.push({ ...payload, id: nextId });
    }
    this.saveLocalSemanasTipo(list);
    return list;
  }

  async removeSemanaTipo(id: number, currentList?: SemanaTipoPlantilla[]): Promise<SemanaTipoPlantilla[]> {
    try {
      const res = await firstValueFrom(
        this.http.delete<{ success: boolean; data: { semanas_tipo: SemanaTipoPlantilla[] } }>(
          `${this.base}/actividades/semanas-tipo/${id}`
        )
      );
      this.formDataCache$ = null;
      const updated = res?.data?.semanas_tipo;
      if (Array.isArray(updated)) {
        this.saveLocalSemanasTipo(updated);
        return updated;
      }
    } catch {}

    const list = (currentList || this.getSemanasTipoList()).filter(x => x.id !== id);
    this.saveLocalSemanasTipo(list);
    return list;
  }

  formatHora12(hora: string): string {
    if (!hora) return '';
    const parts = String(hora).split(':');
    const h = parseInt(parts[0], 10);
    const m = (parts[1] || '00').substring(0, 2);
    if (isNaN(h)) return hora;
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    const hPad = h12 < 10 ? `0${h12}` : `${h12}`;
    return `${hPad}:${m} ${period}`;
  }

  private getTemporadaMeta(temporada: string): { icon: string; label: string; bg: string; color: string; border: string } {
    switch ((temporada || '').toLowerCase()) {
      case 'verano':
        return { icon: 'bi-sun-fill', label: 'Verano', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'otono':
        return { icon: 'bi-tree-fill', label: 'Otoño', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
      case 'invierno':
        return { icon: 'bi-snow2', label: 'Invierno', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'primavera':
        return { icon: 'bi-flower1', label: 'Primavera', bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' };
      default:
        return { icon: 'bi-calendar-week', label: 'General', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  }

  /**
   * Abre el modal interactivo para:
   * 1) Elegir una Semana Tipo (Verano, Otoño, Invierno, etc.), personalizar sus días/horarios al vuelo,
   *    guardarla como plantilla si se desea, y aplicarla a la clase actual.
   * 2) O copiar los horarios desde otra Actividad / Clase existente.
   */
  async promptAplicarSemanaTipo(options: {
    claseNombre: string;
    semanasIniciales?: SemanaTipoPlantilla[];
    allActividades?: Actividad[];
    currentActividadId?: number | null;
    onCatalogUpdated?: (list: SemanaTipoPlantilla[]) => void;
  }): Promise<{
    modoReemplazar: boolean;
    bloques: Array<{ dia_semana: number; hora_inicio: string; hora_fin: string }>;
  } | null> {
    let semanas = this.getSemanasTipoList(options.semanasIniciales);
    let activeTab: 'plantillas' | 'copiar' = 'plantillas';
    let selectedTemplateId: number | null = semanas[0]?.id ?? null;
    let editingNombre = semanas[0]?.nombre ?? 'Nueva Semana Tipo';
    let editingTemporada = semanas[0]?.temporada ?? 'otono';
    let selectedDias = new Set<number>(semanas[0]?.dias ?? [1, 2, 3, 4]);
    let franjas: SemanaTipoFranja[] = (semanas[0]?.franjas ?? [{ hora_inicio: '16:00', hora_fin: '17:00' }]).map(f => ({
      hora_inicio: f.hora_inicio.substring(0, 5),
      hora_fin: f.hora_fin.substring(0, 5),
    }));
    let modoReemplazar = false;

    const diasCatalog = [
      { num: 1, short: 'Lu', full: 'Lunes' },
      { num: 2, short: 'Ma', full: 'Martes' },
      { num: 3, short: 'Mi', full: 'Miércoles' },
      { num: 4, short: 'Ju', full: 'Jueves' },
      { num: 5, short: 'Vi', full: 'Viernes' },
      { num: 6, short: 'Sá', full: 'Sábado' },
      { num: 7, short: 'Do', full: 'Domingo' },
    ];

    // Construir lista de clases existentes de otras actividades para la pestaña "Copiar de existente"
    const clasesExistentes: Array<{
      key: string;
      actividadNombre: string;
      claseNombre: string;
      dias: number[];
      franjas: SemanaTipoFranja[];
      resumen: string;
    }> = [];

    for (const act of options.allActividades || []) {
      for (const g of act.grupos_categorias || []) {
        const horarios = g.equipos?.[0]?.horarios?.filter(h => h.is_active !== false) || [];
        if (horarios.length === 0) continue;
        const dSet = Array.from(new Set(horarios.map(h => Number(h.dia_semana)))).sort((a, b) => a - b);
        const fMap = new Map<string, SemanaTipoFranja>();
        for (const h of horarios) {
          const hi = (h.hora_inicio || '08:00').substring(0, 5);
          const hf = (h.hora_fin || '09:00').substring(0, 5);
          fMap.set(`${hi}-${hf}`, { hora_inicio: hi, hora_fin: hf });
        }
        const fList = Array.from(fMap.values()).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        const dLabels = dSet.map(d => diasCatalog.find(x => x.num === d)?.short || d).join(', ');
        const fLabels = fList.map(f => `${this.formatHora12(f.hora_inicio)} - ${this.formatHora12(f.hora_fin)}`).join(' · ');
        clasesExistentes.push({
          key: `${act.id}-${g.id}`,
          actividadNombre: act.nombre,
          claseNombre: g.nombre,
          dias: dSet,
          franjas: fList,
          resumen: `${dLabels} (${fLabels})`,
        });
      }
    }

    const { isConfirmed, value } = await Swal.fire({
      title: '',
      width: 600,
      padding: '0.9rem 1.1rem 0.8rem',
      html: `
        <div style="text-align: left;">
          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0;">
                <i class="bi bi-calendar-week-fill"></i>
              </div>
              <div>
                <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 1rem;">Semanas Tipo y Plantillas de Horario</h5>
                <p style="margin: 1px 0 0; font-size: 0.75rem; color: #64748b;">
                  Clase destino: <strong style="color: #334155;">${options.claseNombre}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Tabs Superiores -->
          <div style="display: flex; gap: 6px; margin-bottom: 10px; background: #f1f5f9; padding: 4px; border-radius: 999px;">
            <button type="button" id="st-tab-plantillas" style="flex: 1; border: none; border-radius: 999px; padding: 5px 12px; font-size: 0.76rem; font-weight: 600; background: #ffffff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: all 0.15s;">
              <i class="bi bi-stars me-1 text-primary"></i>Semanas Tipo (Temporadas)
            </button>
            <button type="button" id="st-tab-copiar" style="flex: 1; border: none; border-radius: 999px; padding: 5px 12px; font-size: 0.76rem; font-weight: 600; background: transparent; color: #64748b; transition: all 0.15s;">
              <i class="bi bi-files me-1"></i>Copiar de otra Actividad
            </button>
          </div>

          <!-- Panel 1: Catálogo de Semanas Tipo -->
          <div id="st-panel-plantillas">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 0.73rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px;">
                1. Selecciona una plantilla base
              </span>
              <button type="button" id="st-btn-new-template" class="btn btn-sm rounded-pill" style="font-size: 0.7rem; padding: 2px 10px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-weight: 600;">
                <i class="bi bi-plus-lg me-1"></i>Nueva Semana Tipo
              </button>
            </div>
            <div id="st-cards-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; max-height: 155px; overflow-y: auto; padding-right: 2px; margin-bottom: 10px;"></div>
          </div>

          <!-- Panel 2: Copiar desde otra actividad existente -->
          <div id="st-panel-copiar" style="display: none; margin-bottom: 10px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;">
              <label style="display: block; font-size: 0.74rem; font-weight: 700; color: #334155; margin-bottom: 5px;">
                Selecciona una Actividad / Clase existente para cargar su patrón de horarios:
              </label>
              <select id="st-copy-select" class="form-select form-select-sm" style="border-radius: 20px; font-size: 0.8rem;">
                <option value="">— Elige una clase con horarios configurados —</option>
                ${clasesExistentes.map((c, idx) => `<option value="${idx}">${c.actividadNombre} · ${c.claseNombre} — ${c.resumen}</option>`).join('')}
              </select>
              <small style="display: block; margin-top: 5px; font-size: 0.7rem; color: #64748b;">
                Al seleccionarla, sus días y horarios se cargarán abajo para que puedas revisarlos o personalizarlos antes de aplicar.
              </small>
            </div>
          </div>

          <!-- Personalizador de Semana (Siempre visible para ajustar días, horas y guardar plantilla) -->
          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 10px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.73rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.4px;">
                <i class="bi bi-sliders me-1 text-primary"></i>2. Personalizar Semana y Horarios
              </span>
              <div style="display: flex; gap: 5px;">
                <button type="button" id="st-btn-save-template" class="btn btn-sm rounded-pill" style="font-size: 0.7rem; padding: 2px 10px; background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; font-weight: 600;" title="Guardar estos días y horarios en el catálogo de Semanas Tipo">
                  <i class="bi bi-bookmark-check-fill me-1"></i>Guardar plantilla
                </button>
              </div>
            </div>

            <!-- Nombre y Temporada de la plantilla -->
            <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 8px; margin-bottom: 9px;">
              <div>
                <label style="font-size: 0.68rem; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Nombre de la Semana Tipo</label>
                <input id="st-input-nombre" type="text" class="form-control form-control-sm bg-white" style="border-radius: 20px; font-size: 0.78rem;" placeholder="Ej. Semana Otoño Vespertino">
              </div>
              <div>
                <label style="font-size: 0.68rem; font-weight: 600; color: #64748b; display: block; margin-bottom: 2px;">Temporada / Etiqueta</label>
                <select id="st-select-temporada" class="form-select form-select-sm bg-white" style="border-radius: 20px; font-size: 0.78rem;">
                  <option value="otono">🍂 Otoño / Escolar</option>
                  <option value="verano">☀️ Verano</option>
                  <option value="invierno">❄️ Invierno</option>
                  <option value="primavera">🌸 Primavera</option>
                  <option value="general">📅 General</option>
                </select>
              </div>
            </div>

            <!-- Días de la semana -->
            <div style="margin-bottom: 9px;">
              <label style="font-size: 0.68rem; font-weight: 600; color: #64748b; display: block; margin-bottom: 4px;">Días que aplica esta semana</label>
              <div id="st-days-pills" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
            </div>

            <!-- Franjas Horarias -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <label style="font-size: 0.68rem; font-weight: 600; color: #64748b;">Franjas horarias por día</label>
                <button type="button" id="st-btn-add-franja" class="btn btn-sm rounded-pill" style="font-size: 0.68rem; padding: 1px 8px; background: #ffffff; color: #2563eb; border: 1px solid #cbd5e1; font-weight: 600;">
                  <i class="bi bi-plus-circle me-1"></i>Añadir bloque de hora
                </button>
              </div>
              <div id="st-franjas-list" style="display: flex; flex-direction: column; gap: 5px; max-height: 125px; overflow-y: auto; padding-right: 2px;"></div>
            </div>

            <!-- Modo de aplicación + Resumen -->
            <div style="margin-top: 9px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div class="form-check form-switch mb-0 d-flex align-items-center gap-2">
                <input id="st-check-reemplazar" class="form-check-input m-0" type="checkbox" role="switch" style="cursor: pointer;">
                <label for="st-check-reemplazar" style="font-size: 0.73rem; color: #334155; font-weight: 500; cursor: pointer;">
                  Reemplazar horarios actuales de la clase
                </label>
              </div>
              <span id="st-summary-badge" class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 0.7rem; padding: 4px 10px;"></span>
            </div>
            <div id="st-toast-feedback" style="display: none; margin-top: 6px; font-size: 0.72rem; font-weight: 600; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 4px 8px; text-align: center;"></div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check2-circle me-1"></i>Aplicar a la clase',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusConfirm: false,
      didOpen: (popup) => {
        const htmlContainer = popup.querySelector<HTMLElement>('.swal2-html-container');
        if (htmlContainer) {
          htmlContainer.style.margin = '0';
          htmlContainer.style.padding = '0';
        }
        const actionsEl = popup.querySelector<HTMLElement>('.swal2-actions');
        if (actionsEl) {
          actionsEl.style.width = '100%';
          actionsEl.style.display = 'flex';
          actionsEl.style.justifyContent = 'space-between';
          actionsEl.style.margin = '0.55rem 0 0 0';
          actionsEl.style.padding = '0';
        }
        const confirmBtn = popup.querySelector<HTMLElement>('.swal2-confirm');
        const cancelBtn = popup.querySelector<HTMLElement>('.swal2-cancel');
        [confirmBtn, cancelBtn].forEach(btn => {
          if (btn) {
            btn.style.fontSize = '0.76rem';
            btn.style.padding = '0.3rem 0.75rem';
            btn.style.borderRadius = '8px';
            btn.style.margin = '0';
            btn.style.fontWeight = '600';
          }
        });

        const tabPlantillas = popup.querySelector<HTMLButtonElement>('#st-tab-plantillas');
        const tabCopiar = popup.querySelector<HTMLButtonElement>('#st-tab-copiar');
        const panelPlantillas = popup.querySelector<HTMLElement>('#st-panel-plantillas');
        const panelCopiar = popup.querySelector<HTMLElement>('#st-panel-copiar');
        const cardsListEl = popup.querySelector<HTMLElement>('#st-cards-list');
        const daysPillsEl = popup.querySelector<HTMLElement>('#st-days-pills');
        const franjasListEl = popup.querySelector<HTMLElement>('#st-franjas-list');
        const inputNombre = popup.querySelector<HTMLInputElement>('#st-input-nombre');
        const selectTemporada = popup.querySelector<HTMLSelectElement>('#st-select-temporada');
        const summaryBadge = popup.querySelector<HTMLElement>('#st-summary-badge');
        const btnNewTemplate = popup.querySelector<HTMLButtonElement>('#st-btn-new-template');
        const btnAddFranja = popup.querySelector<HTMLButtonElement>('#st-btn-add-franja');
        const btnSaveTemplate = popup.querySelector<HTMLButtonElement>('#st-btn-save-template');
        const copySelect = popup.querySelector<HTMLSelectElement>('#st-copy-select');
        const checkReemplazar = popup.querySelector<HTMLInputElement>('#st-check-reemplazar');
        const toastFeedback = popup.querySelector<HTMLElement>('#st-toast-feedback');

        const showMiniFeedback = (msg: string) => {
          if (!toastFeedback) return;
          toastFeedback.textContent = msg;
          toastFeedback.style.display = 'block';
          setTimeout(() => {
            toastFeedback.style.display = 'none';
          }, 2600);
        };

        const updateSummary = () => {
          if (!summaryBadge) return;
          const total = selectedDias.size * franjas.length;
          summaryBadge.textContent = `${selectedDias.size} día(s) × ${franjas.length} bloque(s) = ${total} horario(s)`;
        };

        const renderCards = () => {
          if (!cardsListEl) return;
          cardsListEl.innerHTML = semanas
            .map(s => {
              const isSel = s.id === selectedTemplateId;
              const meta = this.getTemporadaMeta(s.temporada);
              const dNames = (s.dias || [])
                .map(d => diasCatalog.find(x => x.num === Number(d))?.short || d)
                .join('-');
              const fCount = (s.franjas || []).length;
              const firstF = s.franjas?.[0]
                ? `${this.formatHora12(s.franjas[0].hora_inicio)} – ${this.formatHora12(s.franjas[s.franjas.length - 1].hora_fin)}`
                : '';
              return `
                <div class="st-card-item" data-id="${s.id}" style="
                  position: relative;
                  display: flex; flex-direction: column; justify-content: space-between;
                  padding: 7px 9px; border-radius: 10px; cursor: pointer;
                  border: 1.5px solid ${isSel ? '#2563eb' : '#e2e8f0'};
                  background: ${isSel ? '#eff6ff' : '#ffffff'};
                  transition: all 0.14s ease;
                ">
                  <div style="display: flex; align-items: start; justify-content: space-between; gap: 4px;">
                    <span style="
                      display: inline-flex; align-items: center; gap: 4px;
                      font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
                      padding: 1px 6px; border-radius: 99px;
                      background: ${meta.bg}; color: ${meta.color}; border: 1px solid ${meta.border};
                    ">
                      <i class="bi ${meta.icon}"></i> ${meta.label}
                    </span>
                    ${semanas.length > 1 ? `
                      <button type="button" class="st-del-template btn btn-link p-0 text-secondary" data-del-id="${s.id}" title="Eliminar plantilla" style="font-size: 0.68rem; line-height: 1; text-decoration: none;">
                        <i class="bi bi-trash3"></i>
                      </button>
                    ` : ''}
                  </div>
                  <div style="font-size: 0.76rem; font-weight: 700; color: ${isSel ? '#1e40af' : '#1e293b'}; margin-top: 4px; line-height: 1.2;">
                    ${s.nombre}
                  </div>
                  <div style="font-size: 0.66rem; color: #64748b; margin-top: 3px;">
                    <strong>${dNames}</strong> · ${firstF} (${fCount})
                  </div>
                </div>
              `;
            })
            .join('');

          cardsListEl.querySelectorAll<HTMLElement>('.st-card-item').forEach(card => {
            card.addEventListener('click', (ev) => {
              const target = ev.target as HTMLElement;
              if (target.closest('.st-del-template')) return;
              const id = Number(card.getAttribute('data-id'));
              const found = semanas.find(x => x.id === id);
              if (!found) return;
              selectedTemplateId = found.id;
              editingNombre = found.nombre;
              editingTemporada = found.temporada || 'general';
              selectedDias = new Set((found.dias || []).map(Number));
              franjas = (found.franjas || []).map(f => ({
                hora_inicio: f.hora_inicio.substring(0, 5),
                hora_fin: f.hora_fin.substring(0, 5),
              }));
              if (inputNombre) inputNombre.value = editingNombre;
              if (selectTemporada) selectTemporada.value = editingTemporada;
              renderCards();
              renderDays();
              renderFranjas();
              updateSummary();
            });
          });

          cardsListEl.querySelectorAll<HTMLButtonElement>('.st-del-template').forEach(delBtn => {
            delBtn.addEventListener('click', async (ev) => {
              ev.stopPropagation();
              const delId = Number(delBtn.getAttribute('data-del-id'));
              semanas = await this.removeSemanaTipo(delId, semanas);
              options.onCatalogUpdated?.(semanas);
              if (selectedTemplateId === delId) {
                selectedTemplateId = semanas[0]?.id ?? null;
                if (semanas[0]) {
                  editingNombre = semanas[0].nombre;
                  editingTemporada = semanas[0].temporada;
                  selectedDias = new Set(semanas[0].dias.map(Number));
                  franjas = semanas[0].franjas.map(f => ({ ...f }));
                  if (inputNombre) inputNombre.value = editingNombre;
                  if (selectTemporada) selectTemporada.value = editingTemporada;
                }
              }
              renderCards();
              renderDays();
              renderFranjas();
              updateSummary();
              showMiniFeedback('Plantilla eliminada del catálogo');
            });
          });
        };

        const renderDays = () => {
          if (!daysPillsEl) return;
          daysPillsEl.innerHTML = diasCatalog
            .map(d => {
              const active = selectedDias.has(d.num);
              return `
                <button type="button" class="st-day-btn" data-day="${d.num}" style="
                  border-radius: 999px; padding: 3px 11px; font-size: 0.74rem; font-weight: 600;
                  border: 1.5px solid ${active ? '#2563eb' : '#cbd5e1'};
                  background: ${active ? '#2563eb' : '#ffffff'};
                  color: ${active ? '#ffffff' : '#475569'};
                  cursor: pointer; transition: all 0.12s ease;
                ">
                  ${d.full}
                </button>
              `;
            })
            .join('');

          daysPillsEl.querySelectorAll<HTMLButtonElement>('.st-day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const dNum = Number(btn.getAttribute('data-day'));
              if (selectedDias.has(dNum)) {
                selectedDias.delete(dNum);
              } else {
                selectedDias.add(dNum);
              }
              Swal.resetValidationMessage();
              renderDays();
              updateSummary();
            });
          });
        };

        const renderFranjas = () => {
          if (!franjasListEl) return;
          franjasListEl.innerHTML = franjas
            .map((f, idx) => `
              <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 4px 8px; border-radius: 20px; border: 1px solid #e2e8f0;">
                <span style="font-size: 0.68rem; font-weight: 700; color: #64748b; min-width: 52px;">Bloque ${idx + 1}</span>
                <input type="time" class="form-control form-control-sm border-0 bg-transparent fw-semibold st-f-ini" data-idx="${idx}" value="${f.hora_inicio}" style="font-size: 0.78rem; box-shadow: none;">
                <span style="font-size: 0.72rem; color: #94a3b8;">a</span>
                <input type="time" class="form-control form-control-sm border-0 bg-transparent fw-semibold st-f-fin" data-idx="${idx}" value="${f.hora_fin}" style="font-size: 0.78rem; box-shadow: none;">
                ${franjas.length > 1 ? `
                  <button type="button" class="btn btn-sm btn-link text-danger p-0 st-f-del" data-idx="${idx}" style="font-size: 0.76rem;">
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                ` : ''}
              </div>
            `)
            .join('');

          franjasListEl.querySelectorAll<HTMLInputElement>('.st-f-ini').forEach(inp => {
            inp.addEventListener('change', () => {
              const i = Number(inp.getAttribute('data-idx'));
              if (franjas[i]) franjas[i].hora_inicio = inp.value;
              Swal.resetValidationMessage();
            });
          });
          franjasListEl.querySelectorAll<HTMLInputElement>('.st-f-fin').forEach(inp => {
            inp.addEventListener('change', () => {
              const i = Number(inp.getAttribute('data-idx'));
              if (franjas[i]) franjas[i].hora_fin = inp.value;
              Swal.resetValidationMessage();
            });
          });
          franjasListEl.querySelectorAll<HTMLButtonElement>('.st-f-del').forEach(btn => {
            btn.addEventListener('click', () => {
              const i = Number(btn.getAttribute('data-idx'));
              franjas.splice(i, 1);
              renderFranjas();
              updateSummary();
            });
          });
        };

        if (inputNombre) {
          inputNombre.value = editingNombre;
          inputNombre.addEventListener('input', () => {
            editingNombre = inputNombre.value;
          });
        }
        if (selectTemporada) {
          selectTemporada.value = editingTemporada;
          selectTemporada.addEventListener('change', () => {
            editingTemporada = selectTemporada.value;
          });
        }
        if (checkReemplazar) {
          checkReemplazar.addEventListener('change', () => {
            modoReemplazar = checkReemplazar.checked;
          });
        }

        tabPlantillas?.addEventListener('click', () => {
          activeTab = 'plantillas';
          tabPlantillas.style.background = '#ffffff';
          tabPlantillas.style.color = '#1e293b';
          tabPlantillas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          if (tabCopiar) {
            tabCopiar.style.background = 'transparent';
            tabCopiar.style.color = '#64748b';
            tabCopiar.style.boxShadow = 'none';
          }
          if (panelPlantillas) panelPlantillas.style.display = 'block';
          if (panelCopiar) panelCopiar.style.display = 'none';
        });

        tabCopiar?.addEventListener('click', () => {
          activeTab = 'copiar';
          tabCopiar.style.background = '#ffffff';
          tabCopiar.style.color = '#1e293b';
          tabCopiar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          if (tabPlantillas) {
            tabPlantillas.style.background = 'transparent';
            tabPlantillas.style.color = '#64748b';
            tabPlantillas.style.boxShadow = 'none';
          }
          if (panelPlantillas) panelPlantillas.style.display = 'none';
          if (panelCopiar) panelCopiar.style.display = 'block';
        });

        copySelect?.addEventListener('change', () => {
          const idx = Number(copySelect.value);
          const source = clasesExistentes[idx];
          if (!source) return;
          selectedTemplateId = null;
          editingNombre = `Semana ${source.actividadNombre} (${source.claseNombre})`;
          editingTemporada = 'general';
          selectedDias = new Set(source.dias);
          franjas = source.franjas.map(f => ({ ...f }));
          if (inputNombre) inputNombre.value = editingNombre;
          if (selectTemporada) selectTemporada.value = editingTemporada;
          renderDays();
          renderFranjas();
          updateSummary();
          showMiniFeedback('Horarios cargados en el personalizador');
        });

        btnNewTemplate?.addEventListener('click', () => {
          selectedTemplateId = null;
          editingNombre = 'Nueva Semana Personalizada';
          editingTemporada = 'general';
          selectedDias = new Set([1, 2, 3, 4]);
          franjas = [{ hora_inicio: '16:00', hora_fin: '17:00' }];
          if (inputNombre) {
            inputNombre.value = editingNombre;
            inputNombre.focus();
            inputNombre.select();
          }
          if (selectTemporada) selectTemporada.value = editingTemporada;
          renderCards();
          renderDays();
          renderFranjas();
          updateSummary();
        });

        btnAddFranja?.addEventListener('click', () => {
          const last = franjas[franjas.length - 1];
          let nextIni = '16:00';
          let nextFin = '17:00';
          if (last) {
            nextIni = last.hora_fin;
            const h = parseInt(nextIni.split(':')[0], 10);
            const m = nextIni.split(':')[1] || '00';
            const nh = Math.min(23, h + 1);
            nextFin = `${nh < 10 ? '0' + nh : nh}:${m}`;
          }
          franjas.push({ hora_inicio: nextIni, hora_fin: nextFin });
          renderFranjas();
          updateSummary();
        });

        btnSaveTemplate?.addEventListener('click', async () => {
          const nom = (inputNombre?.value || '').trim();
          if (!nom) {
            Swal.showValidationMessage('Escribe un nombre para guardar la Semana Tipo');
            return;
          }
          if (selectedDias.size === 0 || franjas.length === 0) {
            Swal.showValidationMessage('Selecciona al menos un día y un bloque de horario');
            return;
          }
          for (const f of franjas) {
            if (!f.hora_inicio || !f.hora_fin || f.hora_fin <= f.hora_inicio) {
              Swal.showValidationMessage('Verifica que cada bloque tenga hora fin posterior a la de inicio');
              return;
            }
          }
          Swal.resetValidationMessage();
          const diasArr = Array.from(selectedDias).sort((a, b) => a - b);
          semanas = await this.persistSemanaTipo(
            {
              nombre: nom,
              temporada: editingTemporada,
              dias: diasArr,
              franjas: franjas.map(f => ({ ...f })),
            },
            selectedTemplateId,
            semanas
          );
          options.onCatalogUpdated?.(semanas);
          if (!selectedTemplateId && semanas.length > 0) {
            selectedTemplateId = semanas[semanas.length - 1].id;
          }
          renderCards();
          showMiniFeedback('¡Semana Tipo guardada en el catálogo!');
        });

        renderCards();
        renderDays();
        renderFranjas();
        updateSummary();
      },
      preConfirm: () => {
        if (selectedDias.size === 0) {
          Swal.showValidationMessage('Selecciona al menos un día de la semana');
          return false;
        }
        if (franjas.length === 0) {
          Swal.showValidationMessage('Agrega al menos una franja horaria');
          return false;
        }
        for (const f of franjas) {
          if (!f.hora_inicio || !f.hora_fin || f.hora_fin <= f.hora_inicio) {
            Swal.showValidationMessage('La hora de fin debe ser posterior a la hora de inicio en todos los bloques');
            return false;
          }
        }
        const diasOrdenados = Array.from(selectedDias).sort((a, b) => a - b);
        const bloques: Array<{ dia_semana: number; hora_inicio: string; hora_fin: string }> = [];
        for (const dia of diasOrdenados) {
          for (const f of franjas) {
            bloques.push({
              dia_semana: dia,
              hora_inicio: f.hora_inicio,
              hora_fin: f.hora_fin,
            });
          }
        }
        return {
          modoReemplazar,
          bloques,
        };
      },
    });

    return isConfirmed && value ? value : null;
  }

  /**
   * Toma los horarios actuales de una clase y permite guardarlos como una nueva Semana Tipo personalizada.
   */
  async promptGuardarClaseComoSemanaTipo(options: {
    claseNombre: string;
    horariosActuales: Array<{ dia_semana: number; hora_inicio: string; hora_fin: string; is_active?: boolean }>;
    semanasIniciales?: SemanaTipoPlantilla[];
    onCatalogUpdated?: (list: SemanaTipoPlantilla[]) => void;
  }): Promise<boolean> {
    const activos = (options.horariosActuales || []).filter(h => h.is_active !== false);
    const dias = Array.from(new Set(activos.map(h => Number(h.dia_semana)))).sort((a, b) => a - b);
    const franjasMap = new Map<string, SemanaTipoFranja>();
    for (const h of activos) {
      const hi = (h.hora_inicio || '08:00').substring(0, 5);
      const hf = (h.hora_fin || '09:00').substring(0, 5);
      franjasMap.set(`${hi}-${hf}`, { hora_inicio: hi, hora_fin: hf });
    }
    const franjas = Array.from(franjasMap.values()).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const { isConfirmed, value } = await Swal.fire({
      title: '',
      width: 440,
      padding: '0.85rem 1rem 0.75rem',
      html: `
        <div style="text-align: left;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
              <i class="bi bi-bookmark-plus-fill"></i>
            </div>
            <div>
              <h5 style="margin: 0; font-weight: 700; color: #0f172a; font-size: 0.98rem;">Guardar como Semana Tipo</h5>
              <p style="margin: 1px 0 0; font-size: 0.74rem; color: #64748b;">
                Se guardará el patrón de <strong>${dias.length} día(s)</strong> y <strong>${franjas.length} bloque(s)</strong>
              </p>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 12px;">
            <div style="margin-bottom: 8px;">
              <label style="display: block; font-size: 0.73rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
                Nombre de la Semana Tipo
              </label>
              <input id="swal-new-st-nombre" type="text" class="form-control form-control-sm bg-white"
                     style="border-radius: 20px; font-size: 0.82rem;"
                     placeholder="Ej. Semana Invierno - ${options.claseNombre}"
                     value="Semana ${options.claseNombre}">
            </div>
            <div>
              <label style="display: block; font-size: 0.73rem; font-weight: 700; color: #334155; margin-bottom: 4px;">
                Temporada / Categoría
              </label>
              <select id="swal-new-st-temporada" class="form-select form-select-sm bg-white" style="border-radius: 20px; font-size: 0.82rem;">
                <option value="otono">🍂 Otoño / Escolar</option>
                <option value="verano">☀️ Verano</option>
                <option value="invierno">❄️ Invierno</option>
                <option value="primavera">🌸 Primavera</option>
                <option value="general">📅 General</option>
              </select>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check2 me-1"></i>Guardar plantilla',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const nom = Swal.getPopup()?.querySelector<HTMLInputElement>('#swal-new-st-nombre')?.value?.trim() || '';
        const temp = Swal.getPopup()?.querySelector<HTMLSelectElement>('#swal-new-st-temporada')?.value || 'general';
        if (!nom) {
          Swal.showValidationMessage('Ingresa un nombre para la plantilla');
          return false;
        }
        return { nombre: nom, temporada: temp };
      },
    });

    if (!isConfirmed || !value) return false;

    const updated = await this.persistSemanaTipo(
      {
        nombre: value.nombre,
        temporada: value.temporada,
        dias: dias.length > 0 ? dias : [1, 2, 3, 4],
        franjas: franjas.length > 0 ? franjas : [{ hora_inicio: '16:00', hora_fin: '17:00' }],
      },
      null,
      options.semanasIniciales
    );
    options.onCatalogUpdated?.(updated);
    return true;
  }
}
