/**
 * Constantes del editor de horario — Curso de Verano
 * Fuente de verdad para actividades, bloques horarios y niveles.
 */

// ── Niveles (I-VIII) ────────────────────────────────────────────────────────
export const SC_LEVELS = [
  { n: 1, roman: 'I',    age: '3 años'     },
  { n: 2, roman: 'II',   age: '4 años'     },
  { n: 3, roman: 'III',  age: '5 años'     },
  { n: 4, roman: 'IV',   age: '6 años'     },
  { n: 5, roman: 'V',    age: '7 años'     },
  { n: 6, roman: 'VI',   age: '8-9 años'   },
  { n: 7, roman: 'VII',  age: '10-12 años' },
  { n: 8, roman: 'VIII', age: '13+ años'   },
] as const;

export type ScLevelNum = (typeof SC_LEVELS)[number]['n'];

// ── Bloques horarios ────────────────────────────────────────────────────────
export const SC_SLOTS = [
  { id: 'b1', label: 'Bloque 1', start: '09:10:00', end: '10:10:00', display: '9:10 – 10:10'   },
  { id: 'b2', label: 'Bloque 2', start: '10:15:00', end: '11:15:00', display: '10:15 – 11:15'  },
  { id: 'b3', label: 'Bloque 3', start: '11:45:00', end: '12:45:00', display: '11:45 – 12:45'  },
  { id: 'b4', label: 'Bloque 4', start: '12:50:00', end: '13:50:00', display: '12:50 – 13:50'  },
] as const;

export type ScSlotId = (typeof SC_SLOTS)[number]['id'];

// ── Días de la semana ────────────────────────────────────────────────────────
export const SC_DAYS = [
  { idx: 0, value: 'monday',    label: 'Lunes'     },
  { idx: 1, value: 'tuesday',   label: 'Martes'    },
  { idx: 2, value: 'wednesday', label: 'Miércoles' },
  { idx: 3, value: 'thursday',  label: 'Jueves'    },
  { idx: 4, value: 'friday',    label: 'Viernes'   },
] as const;

export type ScDayValue = (typeof SC_DAYS)[number]['value'];

// ── Filas fijas del horario ─────────────────────────────────────────────────
export const SC_FIXED_ROWS = [
  { id: 'reception', label: 'Recepción',  time: '8:30 – 9:00',  css: 'row-reception' },
  { id: 'snack',     label: 'Refrigerio', time: '11:20 – 11:40', css: 'row-snack'    },
  { id: 'exit',      label: 'Salida',     time: '14:00',         css: 'row-exit'     },
] as const;

// ── Catálogo de actividades ─────────────────────────────────────────────────
export type ScActivityCategory = 'aquatic' | 'sports' | 'martial' | 'cultural';

export interface ScActivityType {
  id: string;
  label: string;
  emoji: string;
  cat: ScActivityCategory;
  color: string;    // texto / borde
  bg: string;       // fondo del chip
}

export const SC_ACTIVITIES: ScActivityType[] = [
  // Acuáticas & Box
  { id: 'natacion',      label: 'Natación',       emoji: '🏊', cat: 'aquatic',  color: '#0369a1', bg: '#e0f2fe' },
  { id: 'rec_acuatica',  label: 'Rec. Acuática',  emoji: '🌊', cat: 'aquatic',  color: '#0369a1', bg: '#e0f2fe' },
  { id: 'box',           label: 'Box',            emoji: '🥊', cat: 'aquatic',  color: '#0369a1', bg: '#e0f2fe' },
  // Deportes
  { id: 'futbol',        label: 'Fútbol',         emoji: '⚽', cat: 'sports',   color: '#15803d', bg: '#dcfce7' },
  { id: 'basquetbol',    label: 'Basquetbol',     emoji: '🏀', cat: 'sports',   color: '#15803d', bg: '#dcfce7' },
  { id: 'tenis',         label: 'Tenis',          emoji: '🎾', cat: 'sports',   color: '#15803d', bg: '#dcfce7' },
  { id: 'padel',         label: 'Pádel',          emoji: '🏓', cat: 'sports',   color: '#15803d', bg: '#dcfce7' },
  { id: 'tochito',       label: 'Tochito',        emoji: '🏈', cat: 'sports',   color: '#15803d', bg: '#dcfce7' },
  // Marciales / Juegos
  { id: 'taekwondo',     label: 'Tae Kwon Do',    emoji: '🥋', cat: 'martial',  color: '#b45309', bg: '#fef3c7' },
  { id: 'juegos_org',    label: 'Juegos Org.',    emoji: '🎯', cat: 'martial',  color: '#b45309', bg: '#fef3c7' },
  // Culturales
  { id: 'fit_dance',     label: 'Fit Dance',      emoji: '💃', cat: 'cultural', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'baile_arabe',   label: 'Baile Árabe',    emoji: '🌙', cat: 'cultural', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'campismo',      label: 'Campismo',       emoji: '⛺', cat: 'cultural', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'gimnasia',      label: 'Gimnasia',       emoji: '🤸', cat: 'cultural', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'manualidades',  label: 'Manualidades',   emoji: '✂️', cat: 'cultural', color: '#9333ea', bg: '#f3e8ff' },
];

export const SC_CATEGORIES: { id: ScActivityCategory; label: string; emoji: string; color: string }[] = [
  { id: 'aquatic',  label: 'Acuáticas',  emoji: '🏊', color: '#0369a1' },
  { id: 'sports',   label: 'Deportes',   emoji: '⚽', color: '#15803d' },
  { id: 'martial',  label: 'Marciales',  emoji: '🥋', color: '#b45309' },
  { id: 'cultural', label: 'Culturales', emoji: '💃', color: '#9333ea' },
];

/** Mapa rápido de actividad por id */
export const SC_ACTIVITY_MAP: Record<string, ScActivityType> = Object.fromEntries(
  SC_ACTIVITIES.map(a => [a.id, a])
);

/** Mapa rápido de bloque por id */
export const SC_SLOT_MAP: Record<string, typeof SC_SLOTS[number]> = Object.fromEntries(
  SC_SLOTS.map(s => [s.id, s])
);
