export type ManiobraTipo =
  | 'positivo_negativo'
  | 'normal_anormal'
  | 'rango'
  | 'hallazgos'
  | 'medicion_cm'
  | 'prension_kg';

export type ManiobraLado = '—' | 'Der' | 'Izq';

export type ManiobraPosicion =
  | 'De pie'
  | 'Sentado'
  | 'Decúbito supino'
  | 'Decúbito prono';

export interface ManiobraCatalogItem {
  id: string;
  nombre: string;
  area: string;
  posicion: ManiobraPosicion;
  lado: ManiobraLado;
  tipo: ManiobraTipo;
  referencia: string;
  rangos?: string[];
  rangoReferencia?: string;
  opciones?: string[];
  incluyeOpcionesEstandar?: boolean;
  omitible: boolean;
  nordicRegion: string;
  resumenKey: string;
}

export interface ManiobraCaptura {
  resultado?: 'Positivo' | 'Negativo' | 'Normal' | 'Anormal' | 'No realizada' | '';
  rango?: string;
  hallazgos?: string[];
  medicion1?: number | null;
  medicion2?: number | null;
  tomas?: [number | null, number | null, number | null];
  dolor?: number | null;
  observaciones?: string;
  omitida?: boolean;
}

export interface ResumenRegionDef {
  key: string;
  label: string;
  area: string;
  lado: ManiobraLado;
  nordicKey: string;
}

export const OPCIONES_ESTANDAR_MOVIMIENTO: string[] = [
  'Arco completo',
  'Arco limitado',
  'Dolor durante el movimiento',
  'Dolor al final del arco',
  'Crepitación'
];

export const AREAS_EXPLORACION: string[] = [
  'Marcha y neurológico',
  'Columna cervical',
  'Hombro',
  'Codo y antebrazo',
  'Muñeca y mano',
  'Columna dorsal',
  'Columna lumbar',
  'Cadera',
  'Rodilla',
  'Tobillo y pie'
];

export const RESUMEN_16_REGIONES: ResumenRegionDef[] = [
  { key: 'marcha_neurologico', label: 'Marcha y neurológico', area: 'Marcha y neurológico', lado: '—', nordicKey: 'siempre' },
  { key: 'columna_cervical', label: 'Columna cervical', area: 'Columna cervical', lado: '—', nordicKey: 'cuello' },
  { key: 'hombro_der', label: 'Hombro derecho', area: 'Hombro', lado: 'Der', nordicKey: 'hombro_derecho' },
  { key: 'hombro_izq', label: 'Hombro izquierdo', area: 'Hombro', lado: 'Izq', nordicKey: 'hombro_izquierdo' },
  { key: 'codo_der', label: 'Codo y antebrazo derecho', area: 'Codo y antebrazo', lado: 'Der', nordicKey: 'codo_antebrazo' },
  { key: 'codo_izq', label: 'Codo y antebrazo izquierdo', area: 'Codo y antebrazo', lado: 'Izq', nordicKey: 'codo_antebrazo' },
  { key: 'muneca_der', label: 'Muñeca y mano derecha', area: 'Muñeca y mano', lado: 'Der', nordicKey: 'muneca_mano' },
  { key: 'muneca_izq', label: 'Muñeca y mano izquierda', area: 'Muñeca y mano', lado: 'Izq', nordicKey: 'muneca_mano' },
  { key: 'columna_dorsal', label: 'Columna dorsal', area: 'Columna dorsal', lado: '—', nordicKey: 'espalda_alta' },
  { key: 'columna_lumbar', label: 'Columna lumbar', area: 'Columna lumbar', lado: '—', nordicKey: 'espalda_baja' },
  { key: 'cadera_der', label: 'Cadera derecha', area: 'Cadera', lado: 'Der', nordicKey: 'cadera_muslo' },
  { key: 'cadera_izq', label: 'Cadera izquierda', area: 'Cadera', lado: 'Izq', nordicKey: 'cadera_muslo' },
  { key: 'rodilla_der', label: 'Rodilla derecha', area: 'Rodilla', lado: 'Der', nordicKey: 'rodilla' },
  { key: 'rodilla_izq', label: 'Rodilla izquierda', area: 'Rodilla', lado: 'Izq', nordicKey: 'rodilla' },
  { key: 'tobillo_der', label: 'Tobillo y pie derecho', area: 'Tobillo y pie', lado: 'Der', nordicKey: 'tobillo_pie' },
  { key: 'tobillo_izq', label: 'Tobillo y pie izquierdo', area: 'Tobillo y pie', lado: 'Izq', nordicKey: 'tobillo_pie' }
];

export interface GripStrengthRow {
  minAge: number;
  maxAge: number;
  hombresDebilMax: number;
  hombresFuerteMin: number;
  mujeresDebilMax: number;
  mujeresFuerteMin: number;
}

export const TABLA_PRENSION: GripStrengthRow[] = [
  { minAge: 18, maxAge: 24, hombresDebilMax: 41.4, hombresFuerteMin: 51.2, mujeresDebilMax: 22.4, mujeresFuerteMin: 33.8 },
  { minAge: 25, maxAge: 29, hombresDebilMax: 43.3, hombresFuerteMin: 59.4, mujeresDebilMax: 25.4, mujeresFuerteMin: 33.6 },
  { minAge: 30, maxAge: 34, hombresDebilMax: 36.4, hombresFuerteMin: 56.4, mujeresDebilMax: 23.9, mujeresFuerteMin: 33.0 },
  { minAge: 35, maxAge: 39, hombresDebilMax: 39.7, hombresFuerteMin: 54.3, mujeresDebilMax: 24.5, mujeresFuerteMin: 33.0 },
  { minAge: 40, maxAge: 44, hombresDebilMax: 39.9, hombresFuerteMin: 54.4, mujeresDebilMax: 26.5, mujeresFuerteMin: 33.8 },
  { minAge: 45, maxAge: 49, hombresDebilMax: 35.8, hombresFuerteMin: 48.2, mujeresDebilMax: 25.2, mujeresFuerteMin: 34.4 },
  { minAge: 50, maxAge: 54, hombresDebilMax: 39.0, hombresFuerteMin: 52.3, mujeresDebilMax: 24.6, mujeresFuerteMin: 32.7 },
  { minAge: 55, maxAge: 59, hombresDebilMax: 32.4, hombresFuerteMin: 47.8, mujeresDebilMax: 20.7, mujeresFuerteMin: 30.2 },
  { minAge: 60, maxAge: 64, hombresDebilMax: 30.4, hombresFuerteMin: 44.9, mujeresDebilMax: 19.2, mujeresFuerteMin: 28.1 },
  { minAge: 65, maxAge: 69, hombresDebilMax: 31.5, hombresFuerteMin: 45.8, mujeresDebilMax: 19.3, mujeresFuerteMin: 25.0 },
  { minAge: 70, maxAge: 74, hombresDebilMax: 29.3, hombresFuerteMin: 41.2, mujeresDebilMax: 19.5, mujeresFuerteMin: 23.9 },
  { minAge: 75, maxAge: 79, hombresDebilMax: 25.9, hombresFuerteMin: 36.6, mujeresDebilMax: 15.7, mujeresFuerteMin: 22.4 },
  { minAge: 80, maxAge: 85, hombresDebilMax: 21.5, hombresFuerteMin: 34.6, mujeresDebilMax: 16.6, mujeresFuerteMin: 21.8 }
];

export function calcularMediaPrension(tomas?: [number | null, number | null, number | null]): number | null {
  if (!tomas) return null;
  const valid = tomas.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v) && v >= 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

export function clasificarPrension(
  mediaKg: number | null,
  edad: number | string | null | undefined,
  sexo: string | null | undefined
): 'Débil' | 'Normal' | 'Fuerte' | null {
  if (mediaKg === null) return null;
  const ageNum = Number(edad);
  if (!ageNum || ageNum < 18) return null;
  const clampedAge = Math.min(Math.max(Math.round(ageNum), 18), 85);
  const row = TABLA_PRENSION.find(r => clampedAge >= r.minAge && clampedAge <= r.maxAge);
  if (!row) return null;

  const s = (sexo || '').toLowerCase();
  const isFemale = s.startsWith('f') || s.startsWith('m') && s.includes('muj');
  const debilMax = isFemale ? row.mujeresDebilMax : row.hombresDebilMax;
  const fuerteMin = isFemale ? row.mujeresFuerteMin : row.hombresFuerteMin;

  if (mediaKg < debilMax) return 'Débil';
  if (mediaKg > fuerteMin) return 'Fuerte';
  return 'Normal';
}

type RawManiobra = [
  id: string,
  nombre: string,
  area: string,
  posicion: ManiobraPosicion,
  lado: ManiobraLado,
  tipo: ManiobraTipo,
  referencia: string,
  rangos: string[] | undefined,
  rangoReferencia: string | undefined,
  opciones: string[] | undefined,
  incluyeOpcionesEstandar: boolean,
  omitible: boolean,
  nordicRegion: string,
  resumenKey: string
];

const R_CERV_FLEX = ['0°–9°', '10°–19°', '20°–24°', '25°–34°', '35°–50°'];
const R_CERV_EXT_INC = ['0°–9°', '10°–19°', '20°–24°', '25°–34°', '35°–45°'];
const R_80_85 = ['0°–19°', '20°–39°', '40°–59°', '60°–79°', '80°–85°'];
const R_161_180 = ['0°–40°', '41°–80°', '81°–120°', '121°–160°', '161°–180°'];
const R_41_60 = ['0°–10°', '11°–20°', '21°–30°', '31°–40°', '41°–60°'];
const R_81_90 = ['0°–20°', '21°–40°', '41°–60°', '61°–80°', '81°–90°'];
const R_LUMB_FLEX = ['0°–19°', '20°–39°', '40°–54°', '55°–74°', '75°–85°'];
const R_21_30 = ['0°–5°', '6°–10°', '11°–15°', '16°–20°', '21°–30°'];
const R_30_40 = ['0°–9°', '10°–14°', '15°–24°', '25°–29°', '30°–40°'];
const R_161_170 = ['0°–40°', '41°–80°', '81°–120°', '121°–160°', '161°–170°'];
const R_CODO_EXT = ['Menos de 0° (déficit de extensión)', '0°–10° (referencia)', '11°–15° (Hiperextensión)'];
const R_80_90 = ['0°–19°', '20°–39°', '40°–59°', '60°–79°', '80°–90°'];
const R_50_60 = ['0°–14°', '15°–24°', '25°–39°', '40°–49°', '50°–60°'];
const R_35_60 = ['0°–9°', '10°–19°', '20°–24°', '25°–34°', '35°–60°'];
const R_25_30 = ['0°–4°', '5°–14°', '15°–19°', '20°–24°', '25°–30°'];
const R_70_80 = ['0°–19°', '20°–34°', '35°–54°', '55°–69°', '70°–80°'];
const R_140_150 = ['0°–34°', '35°–69°', '70°–104°', '105°–139°', '140°–150°'];
const R_45_60 = ['0°–30°', '31°–44°', '45°–60°'];
const R_20_30 = ['0°–4°', '5°–9°', '10°–14°', '15°–19°', '20°–30°'];
const R_40_50 = ['0°–9°', '10°–19°', '20°–29°', '30°–39°', '40°–50°'];

const OP_MARCHA_NORMAL = ['Sin alteraciones', 'Antálgica', 'Asimétrica', 'Inestable', 'En steppage', 'Arrastre o caída del pie', 'Base amplia', 'Marcha rígida o limitada'];
const OP_TALONES = ['No logra elevar una punta', 'La punta desciende durante los pasos', 'Arrastra o golpea el suelo'];
const OP_PUNTAS = ['No logra elevar un talón', 'Baja el talón', 'Pierde altura o resistencia', 'Asimetría'];
const OP_ARCO = ['Sin alteraciones', 'Disminuido o ausente', 'Aumentado', 'Asimétrico', 'Cambia al ponerse de puntas'];
const OP_WINDLASS = ['No se presenta arco plantar', 'Dolor agudo en el talón al levantar el dedo'];
const OP_JOBE = ['Dolor aislado', 'Dolor con debilidad leve', 'Incapacidad para resistir'];
const OP_GERBER = ['No puede despegar el dorso de la mano', 'Debilidad', 'Dolor en la inserción (troquín)'];
const OP_KEMP = ['Dolor local', 'Dolor irradiado', 'Dolor en lado contrario'];
const OP_SLUMP = ['Dolor', 'Hormigueo', 'Irradiación'];
const OP_BAKODY = ['Disminuye el dolor', 'Disminuye el adormecimiento', 'Disminuye el cosquilleo'];
const OP_BURSA = ['Sin hallazgos', 'Hinchazón', 'Sensibilidad', 'Aumento de temperatura', 'Rubor'];
const OP_PULGAR_EXT = ['Normal (menor de 20°)', 'Hiperextensión (mayor de 20°)'];
const OP_PARESTESIA_DOLOR = ['Parestesias', 'Entumecimiento', 'Dolor'];
const OP_TINEL_MUNECA = ['Parestesias', 'Entumecimiento', 'Calambre eléctrico'];
const OP_PHALEN = ['Parestesias', 'Entumecimiento', 'Calambre eléctrico', 'Dolor'];
const OP_SENSIBILIDAD = ['Sin déficit', 'Alterada en pulpejo del índice (nervio mediano)', 'Alterada en pulpejo del anular (inervación mixta)'];
const OP_TRAPECIO = ['Sin hallazgos', 'Dolor', 'Nudos', 'Rigidez'];
const OP_PARAVERTEBRAL = ['Sin hallazgos', 'Contractura', 'Dolor localizado', 'Asimetrías musculares', 'Puntos gatillo'];
const OP_TROCANTER = ['Sin hallazgos', 'Dolor', 'Hipersensibilidad'];
const OP_ESTRES_RODILLA = ['Movimiento excesivo o apertura anormal', 'Dolor', 'Inestabilidad'];
const OP_LASEGUE = ['Lasègue directo: Dolor punzante o eléctrico en pierna lesionada', 'Lasègue cruzado: Dolor punzante o eléctrico en pierna sana', 'Negativo: No presenta dolor'];
const OP_BRAGARD = ['Dolor', 'Hormigueo'];
const OP_CADERA_ROT = ['Dolor en rotación interna', 'RI muy aumentada y RE reducida', 'RE aumentada y RI muy limitada'];
const OP_FABER_FADIR = ['Dolor', 'Limitación'];
const OP_MCMURRAY = ['Positivo medial', 'Positivo lateral', 'Dolor', 'Chasquido audible', 'Sensación de traba'];
const OP_THOMAS = ['Muslo se eleva de la camilla (iliopsoas)', 'La pierna tiende a extender la rodilla (recto femoral)', 'La pierna se desvía hacia afuera (tensor de la fascia lata)'];
const OP_LACHMAN = ['La tibia se mueve hacia adelante', 'Se siente blanda al frenar'];
const OP_TINEL_TARSO = ['Hormigueo', 'Ardor', 'Descarga'];
const OP_INV_EV_TOBILLO = ['Laxitud aumentada', 'Ausencia de tope', 'Dolor intenso'];
const OP_CAJON_TOBILLO = ['Desplazamiento excesivo hacia adelante', 'Diferencia entre ambos lados'];
const OP_APLEY = ['Dolor o chasquido en compresión', 'Rotación externa + compresión duele (menisco interno)', 'Rotación interna + compresión duele (menisco externo)', 'Dolor aumenta en distracción (ligamentos)'];

const RAW_MANIOBRAS: RawManiobra[] = [
  ['DP-01', 'Marcha normal', 'Marcha y neurológico', 'De pie', '—', 'hallazgos', '', undefined, undefined, OP_MARCHA_NORMAL, false, false, 'Siempre se explora', 'marcha_neurologico'],
  ['DP-02D', 'Marcha en talones (L5) derecha', 'Marcha y neurológico', 'De pie', 'Der', 'normal_anormal', '', undefined, undefined, OP_TALONES, false, false, 'Siempre se explora', 'marcha_neurologico'],
  ['DP-02I', 'Marcha en talones (L5) izquierda', 'Marcha y neurológico', 'De pie', 'Izq', 'normal_anormal', '', undefined, undefined, OP_TALONES, false, false, 'Siempre se explora', 'marcha_neurologico'],
  ['DP-03D', 'Marcha en puntas (S1) derecha', 'Marcha y neurológico', 'De pie', 'Der', 'normal_anormal', '', undefined, undefined, OP_PUNTAS, false, false, 'Siempre se explora', 'marcha_neurologico'],
  ['DP-03I', 'Marcha en puntas (S1) izquierda', 'Marcha y neurológico', 'De pie', 'Izq', 'normal_anormal', '', undefined, undefined, OP_PUNTAS, false, false, 'Siempre se explora', 'marcha_neurologico'],
  ['DP-04D', 'Arco plantar derecho', 'Tobillo y pie', 'De pie', 'Der', 'hallazgos', '', undefined, undefined, OP_ARCO, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['DP-04I', 'Arco plantar izquierdo', 'Tobillo y pie', 'De pie', 'Izq', 'hallazgos', '', undefined, undefined, OP_ARCO, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['DP-05D', 'Windlass / Cabestrante derecho', 'Tobillo y pie', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, OP_WINDLASS, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['DP-05I', 'Windlass / Cabestrante izquierdo', 'Tobillo y pie', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_WINDLASS, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['DP-06', 'Flexión cervical', 'Columna cervical', 'De pie', '—', 'rango', '0°-35°/50°', R_CERV_FLEX, '35°–50°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-07', 'Extensión cervical', 'Columna cervical', 'De pie', '—', 'rango', '0°-35°/45°', R_CERV_EXT_INC, '35°–45°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-08', 'Inclinación lateral cervical derecha', 'Columna cervical', 'De pie', '—', 'rango', '0°-35°/45°', R_CERV_EXT_INC, '35°–45°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-09', 'Inclinación lateral cervical izquierda', 'Columna cervical', 'De pie', '—', 'rango', '0°-35°/45°', R_CERV_EXT_INC, '35°–45°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-10', 'Rotación cervical derecha', 'Columna cervical', 'De pie', '—', 'rango', '0°-80°/85°', R_80_85, '80°–85°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-11', 'Rotación cervical izquierda', 'Columna cervical', 'De pie', '—', 'rango', '0°-80°/85°', R_80_85, '80°–85°', undefined, true, true, 'Cuello', 'columna_cervical'],
  ['DP-12D', 'Flexión de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-161°/180°', R_161_180, '161°–180°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-12I', 'Flexión de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-161°/180°', R_161_180, '161°–180°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-13D', 'Extensión de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-41°/60°', R_41_60, '41°–60°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-13I', 'Extensión de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-41°/60°', R_41_60, '41°–60°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-14D', 'Abducción de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-161°/180°', R_161_180, '161°–180°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-14I', 'Abducción de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-161°/180°', R_161_180, '161°–180°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-15D', 'Aducción de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-35°/45°', R_CERV_EXT_INC, '35°–45°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-15I', 'Aducción de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-35°/45°', R_CERV_EXT_INC, '35°–45°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-16D', 'Rotación externa de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-81°/90°', R_81_90, '81°–90°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-16I', 'Rotación externa de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-81°/90°', R_81_90, '81°–90°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-17D', 'Rotación interna de hombro derecho', 'Hombro', 'De pie', 'Der', 'rango', '0°-81°/90°', R_81_90, '81°–90°', undefined, true, true, 'Hombro derecho', 'hombro_der'],
  ['DP-17I', 'Rotación interna de hombro izquierdo', 'Hombro', 'De pie', 'Izq', 'rango', '0°-81°/90°', R_81_90, '81°–90°', undefined, true, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-18D', 'Neer derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-18I', 'Neer izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-19D', 'Hawkins-Kennedy derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-19I', 'Hawkins-Kennedy izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-20D', 'Speed derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-20I', 'Speed izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-21D', 'Jobe / Lata vacía derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, OP_JOBE, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-21I', 'Jobe / Lata vacía izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_JOBE, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-22D', 'Yergason derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-22I', 'Yergason izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-23D', 'Patte derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-23I', 'Patte izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-24D', 'Prueba acromioclavicular derecha', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-24I', 'Prueba acromioclavicular izquierda', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-25D', 'Gerber / Lift-off derecho', 'Hombro', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, OP_GERBER, false, true, 'Hombro derecho', 'hombro_der'],
  ['DP-25I', 'Gerber / Lift-off izquierdo', 'Hombro', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_GERBER, false, true, 'Hombro izquierdo', 'hombro_izq'],
  ['DP-26D', 'Trendelenburg derecho', 'Cadera', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Cadera o muslo', 'cadera_der'],
  ['DP-26I', 'Trendelenburg izquierdo', 'Cadera', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Cadera o muslo', 'cadera_izq'],
  ['DP-27', 'Medición de la expansión torácica', 'Columna dorsal', 'De pie', '—', 'medicion_cm', '≥ 5 cm', undefined, undefined, undefined, false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['DP-28', 'Schober', 'Columna lumbar', 'De pie', '—', 'medicion_cm', 'Aumento ≥ 5 cm', undefined, undefined, undefined, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-29', 'Adams', 'Columna dorsal', 'De pie', '—', 'positivo_negativo', '', undefined, undefined, ['Giba', 'Asimetría'], false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['DP-30', 'Flexión lumbar', 'Columna lumbar', 'De pie', '—', 'rango', '0°-75°/85°', R_LUMB_FLEX, '75°–85°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-31', 'Extensión lumbar', 'Columna lumbar', 'De pie', '—', 'rango', '0°-21°/30°', R_21_30, '21°–30°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-32D', 'Rotación lumbar derecha', 'Columna lumbar', 'De pie', 'Der', 'rango', '0°-21°/30°', R_21_30, '21°–30°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-32I', 'Rotación lumbar izquierda', 'Columna lumbar', 'De pie', 'Izq', 'rango', '0°-21°/30°', R_21_30, '21°–30°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-33D', 'Kemp derecho', 'Columna lumbar', 'De pie', 'Der', 'positivo_negativo', '', undefined, undefined, OP_KEMP, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-33I', 'Kemp izquierdo', 'Columna lumbar', 'De pie', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_KEMP, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-34', 'Inclinación lateral lumbar derecha', 'Columna lumbar', 'De pie', '—', 'rango', '0°-30°/40°', R_30_40, '30°–40°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-35', 'Inclinación lateral lumbar izquierda', 'Columna lumbar', 'De pie', '—', 'rango', '0°-30°/40°', R_30_40, '30°–40°', undefined, true, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['DP-36D', 'Fuerza de agarre mano derecha', 'Muñeca y mano', 'De pie', 'Der', 'prension_kg', 'Tabla por edad y sexo', undefined, undefined, undefined, false, true, 'Muñeca o mano', 'muneca_der'],
  ['DP-36I', 'Fuerza de agarre mano izquierda', 'Muñeca y mano', 'De pie', 'Izq', 'prension_kg', 'Tabla por edad y sexo', undefined, undefined, undefined, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-01', 'Distracción cervical', 'Columna cervical', 'Sentado', '—', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Cuello', 'columna_cervical'],
  ['SE-02', 'Lhermitte', 'Columna cervical', 'Sentado', '—', 'positivo_negativo', '', undefined, undefined, ['Espalda baja', 'Brazos', 'Piernas'], false, true, 'Cuello', 'columna_cervical'],
  ['SE-03D', 'Slump derecho', 'Columna lumbar', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, OP_SLUMP, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SE-03I', 'Slump izquierdo', 'Columna lumbar', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_SLUMP, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SE-04D', 'Bakody derecho', 'Columna cervical', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, OP_BAKODY, false, true, 'Cuello', 'columna_cervical'],
  ['SE-04I', 'Bakody izquierdo', 'Columna cervical', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_BAKODY, false, true, 'Cuello', 'columna_cervical'],
  ['SE-05D', 'Flexión de codo derecho', 'Codo y antebrazo', 'Sentado', 'Der', 'rango', '0°-161°/170°', R_161_170, '161°–170°', undefined, true, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-05I', 'Flexión de codo izquierdo', 'Codo y antebrazo', 'Sentado', 'Izq', 'rango', '0°-161°/170°', R_161_170, '161°–170°', undefined, true, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-06D', 'Extensión de codo derecho', 'Codo y antebrazo', 'Sentado', 'Der', 'rango', '0°-10°', R_CODO_EXT, '0°–10° (referencia)', undefined, true, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-06I', 'Extensión de codo izquierdo', 'Codo y antebrazo', 'Sentado', 'Izq', 'rango', '0°-10°', R_CODO_EXT, '0°–10° (referencia)', undefined, true, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-07D', 'Pronación derecha', 'Codo y antebrazo', 'Sentado', 'Der', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-07I', 'Pronación izquierda', 'Codo y antebrazo', 'Sentado', 'Izq', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-08D', 'Supinación derecha', 'Codo y antebrazo', 'Sentado', 'Der', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-08I', 'Supinación izquierda', 'Codo y antebrazo', 'Sentado', 'Izq', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-09D', 'Cozen derecho', 'Codo y antebrazo', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-09I', 'Cozen izquierdo', 'Codo y antebrazo', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-10D', 'Mill derecho', 'Codo y antebrazo', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-10I', 'Mill izquierdo', 'Codo y antebrazo', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-11D', 'Maudsley derecho', 'Codo y antebrazo', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-11I', 'Maudsley izquierdo', 'Codo y antebrazo', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-12D', 'Bursa olécraniana derecha', 'Codo y antebrazo', 'Sentado', 'Der', 'hallazgos', '', undefined, undefined, OP_BURSA, false, true, 'Codo o antebrazo', 'codo_der'],
  ['SE-12I', 'Bursa olécraniana izquierda', 'Codo y antebrazo', 'Sentado', 'Izq', 'hallazgos', '', undefined, undefined, OP_BURSA, false, true, 'Codo o antebrazo', 'codo_izq'],
  ['SE-13D', 'Flexión de muñeca derecha', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-50°/60°', R_50_60, '50°–60°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-13I', 'Flexión de muñeca izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-50°/60°', R_50_60, '50°–60°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-14D', 'Extensión de muñeca derecha', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-35°/60°', R_35_60, '35°–60°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-14I', 'Extensión de muñeca izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-35°/60°', R_35_60, '35°–60°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-15D', 'Desviación radial derecha', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-25°/30°', R_25_30, '25°–30°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-15I', 'Desviación radial izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-25°/30°', R_25_30, '25°–30°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-16D', 'Desviación cubital derecha', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-30°/40°', R_30_40, '30°–40°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-16I', 'Desviación cubital izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-30°/40°', R_30_40, '30°–40°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-17D', 'Flexión de pulgar derecho', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-17I', 'Flexión de pulgar izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-80°/90°', R_80_90, '80°–90°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-18D', 'Extensión de pulgar derecho', 'Muñeca y mano', 'Sentado', 'Der', 'hallazgos', '0°', undefined, undefined, OP_PULGAR_EXT, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-18I', 'Extensión de pulgar izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'hallazgos', '0°', undefined, undefined, OP_PULGAR_EXT, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-19D', 'Abducción de pulgar derecho', 'Muñeca y mano', 'Sentado', 'Der', 'rango', '0°-70°/80°', R_70_80, '70°–80°', undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-19I', 'Abducción de pulgar izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'rango', '0°-70°/80°', R_70_80, '70°–80°', undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-20D', 'Aducción de pulgar derecho', 'Muñeca y mano', 'Sentado', 'Der', 'hallazgos', '0°', undefined, undefined, undefined, true, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-20I', 'Aducción de pulgar izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'hallazgos', '0°', undefined, undefined, undefined, true, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-21D', 'Finkelstein / Eichhoff derecho', 'Muñeca y mano', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-21I', 'Finkelstein / Eichhoff izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-22D', 'Durkan derecho', 'Muñeca y mano', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, OP_PARESTESIA_DOLOR, false, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-22I', 'Durkan izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_PARESTESIA_DOLOR, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-23D', 'Tinel (muñeca) derecha', 'Muñeca y mano', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, OP_TINEL_MUNECA, false, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-23I', 'Tinel (muñeca) izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_TINEL_MUNECA, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-24D', 'Phalen derecho', 'Muñeca y mano', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, OP_PHALEN, false, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-24I', 'Phalen izquierdo', 'Muñeca y mano', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_PHALEN, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-25D', 'Sensibilidad derecha', 'Muñeca y mano', 'Sentado', 'Der', 'hallazgos', '', undefined, undefined, OP_SENSIBILIDAD, false, true, 'Muñeca o mano', 'muneca_der'],
  ['SE-25I', 'Sensibilidad izquierda', 'Muñeca y mano', 'Sentado', 'Izq', 'hallazgos', '', undefined, undefined, OP_SENSIBILIDAD, false, true, 'Muñeca o mano', 'muneca_izq'],
  ['SE-26D', 'Palpación del músculo trapecio derecho', 'Columna dorsal', 'Sentado', 'Der', 'hallazgos', '', undefined, undefined, OP_TRAPECIO, false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['SE-26I', 'Palpación del músculo trapecio izquierdo', 'Columna dorsal', 'Sentado', 'Izq', 'hallazgos', '', undefined, undefined, OP_TRAPECIO, false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['SE-27D', 'Palpación paravertebral lumbar derecha', 'Columna lumbar', 'Sentado', 'Der', 'hallazgos', '', undefined, undefined, OP_PARAVERTEBRAL, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SE-27I', 'Palpación paravertebral lumbar izquierda', 'Columna lumbar', 'Sentado', 'Izq', 'hallazgos', '', undefined, undefined, OP_PARAVERTEBRAL, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SE-28D', 'Palpación interescapular derecha', 'Columna dorsal', 'Sentado', 'Der', 'hallazgos', '', undefined, undefined, OP_PARAVERTEBRAL, false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['SE-28I', 'Palpación interescapular izquierda', 'Columna dorsal', 'Sentado', 'Izq', 'hallazgos', '', undefined, undefined, OP_PARAVERTEBRAL, false, true, 'Espalda alta (dorsal)', 'columna_dorsal'],
  ['SE-29D', 'Flexión y extensión de rodilla derecha', 'Rodilla', 'Sentado', 'Der', 'rango', '0°-140°/150°', R_140_150, '140°–150°', undefined, true, true, 'Rodilla', 'rodilla_der'],
  ['SE-29I', 'Flexión y extensión de rodilla izquierda', 'Rodilla', 'Sentado', 'Izq', 'rango', '0°-140°/150°', R_140_150, '140°–150°', undefined, true, true, 'Rodilla', 'rodilla_izq'],
  ['SE-30D', 'Signo de la oleada derecho', 'Rodilla', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_der'],
  ['SE-30I', 'Signo de la oleada izquierdo', 'Rodilla', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_izq'],
  ['SE-31D', 'Zohlen / Clarke derecho', 'Rodilla', 'Sentado', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_der'],
  ['SE-31I', 'Zohlen / Clarke izquierdo', 'Rodilla', 'Sentado', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-01D', 'Palpación de trocánter mayor derecho', 'Cadera', 'Decúbito supino', 'Der', 'hallazgos', '', undefined, undefined, OP_TROCANTER, false, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-01I', 'Palpación de trocánter mayor izquierdo', 'Cadera', 'Decúbito supino', 'Izq', 'hallazgos', '', undefined, undefined, OP_TROCANTER, false, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-02D', 'Prueba de estrés en valgo derecha', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_ESTRES_RODILLA, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-02I', 'Prueba de estrés en valgo izquierda', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_ESTRES_RODILLA, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-03D', 'Prueba de estrés en varo derecha', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_ESTRES_RODILLA, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-03I', 'Prueba de estrés en varo izquierda', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_ESTRES_RODILLA, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-04D', 'Cajón anterior (rodilla) derecho', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-04I', 'Cajón anterior (rodilla) izquierdo', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-05D', 'Cajón posterior (rodilla) derecha', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-05I', 'Cajón posterior (rodilla) izquierda', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-06D', 'Lasègue derecho', 'Columna lumbar', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_LASEGUE, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SU-06I', 'Lasègue izquierdo', 'Columna lumbar', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_LASEGUE, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SU-07D', 'Bragard derecho', 'Columna lumbar', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_BRAGARD, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SU-07I', 'Bragard izquierdo', 'Columna lumbar', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_BRAGARD, false, true, 'Espalda baja (lumbar)', 'columna_lumbar'],
  ['SU-08D', 'Rotación interna de cadera derecha', 'Cadera', 'Decúbito supino', 'Der', 'rango', '0°-45°/60°', R_45_60, '45°–60°', OP_CADERA_ROT, true, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-08I', 'Rotación interna de cadera izquierda', 'Cadera', 'Decúbito supino', 'Izq', 'rango', '0°-45°/60°', R_45_60, '45°–60°', OP_CADERA_ROT, true, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-09D', 'Rotación externa de cadera derecha', 'Cadera', 'Decúbito supino', 'Der', 'rango', '0°-45°/60°', R_45_60, '45°–60°', OP_CADERA_ROT, true, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-09I', 'Rotación externa de cadera izquierda', 'Cadera', 'Decúbito supino', 'Izq', 'rango', '0°-45°/60°', R_45_60, '45°–60°', OP_CADERA_ROT, true, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-10D', 'FABER derecho', 'Cadera', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_FABER_FADIR, false, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-10I', 'FABER izquierdo', 'Cadera', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_FABER_FADIR, false, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-11D', 'FADIR derecho', 'Cadera', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_FABER_FADIR, false, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-11I', 'FADIR izquierdo', 'Cadera', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_FABER_FADIR, false, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-12D', 'McMurray derecho', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_MCMURRAY, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-12I', 'McMurray izquierdo', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_MCMURRAY, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-13D', 'Thomas derecho', 'Cadera', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_THOMAS, false, true, 'Cadera o muslo', 'cadera_der'],
  ['SU-13I', 'Thomas izquierdo', 'Cadera', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_THOMAS, false, true, 'Cadera o muslo', 'cadera_izq'],
  ['SU-14D', 'Lachman derecho', 'Rodilla', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_LACHMAN, false, true, 'Rodilla', 'rodilla_der'],
  ['SU-14I', 'Lachman izquierdo', 'Rodilla', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_LACHMAN, false, true, 'Rodilla', 'rodilla_izq'],
  ['SU-15D', 'Tinel en el túnel tarsiano derecho', 'Tobillo y pie', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_TINEL_TARSO, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-15I', 'Tinel en el túnel tarsiano izquierdo', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_TINEL_TARSO, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['SU-16D', 'Dorsiflexión de tobillo derecho', 'Tobillo y pie', 'Decúbito supino', 'Der', 'rango', '0°-20°/30°', R_20_30, '20°–30°', undefined, true, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-16I', 'Dorsiflexión de tobillo izquierdo', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'rango', '0°-20°/30°', R_20_30, '20°–30°', undefined, true, true, 'Tobillo o pie', 'tobillo_izq'],
  ['SU-17D', 'Flexión plantar derecha', 'Tobillo y pie', 'Decúbito supino', 'Der', 'rango', '0°-40°/50°', R_40_50, '40°–50°', undefined, true, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-17I', 'Flexión plantar izquierda', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'rango', '0°-40°/50°', R_40_50, '40°–50°', undefined, true, true, 'Tobillo o pie', 'tobillo_izq'],
  ['SU-18D', 'Inversión de tobillo/pie derecho', 'Tobillo y pie', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_INV_EV_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-18I', 'Inversión de tobillo/pie izquierdo', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_INV_EV_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['SU-19D', 'Eversión de tobillo/pie derecho', 'Tobillo y pie', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_INV_EV_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-19I', 'Eversión de tobillo/pie izquierdo', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_INV_EV_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['SU-20D', 'Cajón anterior del tobillo derecho', 'Tobillo y pie', 'Decúbito supino', 'Der', 'positivo_negativo', '', undefined, undefined, OP_CAJON_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['SU-20I', 'Cajón anterior del tobillo izquierdo', 'Tobillo y pie', 'Decúbito supino', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_CAJON_TOBILLO, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['PR-01D', 'Thompson derecho', 'Tobillo y pie', 'Decúbito prono', 'Der', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Tobillo o pie', 'tobillo_der'],
  ['PR-01I', 'Thompson izquierdo', 'Tobillo y pie', 'Decúbito prono', 'Izq', 'positivo_negativo', '', undefined, undefined, undefined, false, true, 'Tobillo o pie', 'tobillo_izq'],
  ['PR-02D', 'Apley derecho', 'Rodilla', 'Decúbito prono', 'Der', 'positivo_negativo', '', undefined, undefined, OP_APLEY, false, true, 'Rodilla', 'rodilla_der'],
  ['PR-02I', 'Apley izquierdo', 'Rodilla', 'Decúbito prono', 'Izq', 'positivo_negativo', '', undefined, undefined, OP_APLEY, false, true, 'Rodilla', 'rodilla_izq']
];

export const MANIOBRAS_CATALOG: ManiobraCatalogItem[] = RAW_MANIOBRAS.map(r => ({
  id: r[0],
  nombre: r[1],
  area: r[2],
  posicion: r[3],
  lado: r[4],
  tipo: r[5],
  referencia: r[6],
  rangos: r[7],
  rangoReferencia: r[8],
  opciones: r[9],
  incluyeOpcionesEstandar: r[10],
  omitible: r[11],
  nordicRegion: r[12],
  resumenKey: r[13]
}));

export function getOpcionesManiobra(item: ManiobraCatalogItem): string[] {
  const base = item.opciones ? [...item.opciones] : [];
  if (item.incluyeOpcionesEstandar) {
    for (const op of OPCIONES_ESTANDAR_MOVIMIENTO) {
      if (!base.includes(op)) base.push(op);
    }
  }
  return base;
}

export function isHallazgoNormal(opcion: string): boolean {
  const s = opcion.trim();
  return (
    s.startsWith('Sin ') ||
    s.startsWith('Arco completo') ||
    s.startsWith('Rotación completa') ||
    s.startsWith('Negativo') ||
    s.startsWith('Normal') ||
    s.startsWith('Hallazgo normal')
  );
}

export function tieneCapturaManiobra(item: ManiobraCatalogItem, c?: ManiobraCaptura): boolean {
  if (!c) return false;
  if (c.resultado && c.resultado !== 'No realizada') return true;
  if (c.rango) return true;
  if (c.hallazgos && c.hallazgos.length > 0) return true;
  if (c.medicion1 != null || c.medicion2 != null) return true;
  if (c.tomas && c.tomas.some(t => t != null)) return true;
  if (c.dolor != null && c.dolor > 0) return true;
  if (c.observaciones && c.observaciones.trim().length > 0) return true;
  return false;
}

export function evaluarManiobraAlterada(
  item: ManiobraCatalogItem,
  c?: ManiobraCaptura,
  edad?: number | string | null,
  sexo?: string | null
): 'alterado' | 'normal' | 'sin_evaluar' {
  if (!c || c.omitida || c.resultado === 'No realizada') return 'sin_evaluar';

  let hasData = false;
  let altered = false;

  if (c.dolor != null && c.dolor > 0) {
    hasData = true;
    altered = true;
  }

  if (item.tipo === 'positivo_negativo' || item.tipo === 'normal_anormal') {
    if (c.resultado === 'Positivo' || c.resultado === 'Anormal') {
      hasData = true;
      altered = true;
    } else if (c.resultado === 'Negativo' || c.resultado === 'Normal') {
      hasData = true;
    }
  } else if (item.tipo === 'rango') {
    if (c.rango) {
      hasData = true;
      if (item.rangoReferencia && c.rango !== item.rangoReferencia) {
        altered = true;
      }
    }
  } else if (item.tipo === 'medicion_cm') {
    if (c.medicion1 != null && c.medicion2 != null) {
      hasData = true;
      const diff = c.medicion2 - c.medicion1;
      if (diff < 5) altered = true;
    }
  } else if (item.tipo === 'prension_kg') {
    const media = calcularMediaPrension(c.tomas);
    if (media !== null) {
      hasData = true;
      const cls = clasificarPrension(media, edad, sexo);
      if (cls === 'Débil') altered = true;
    }
  }

  if (c.hallazgos && c.hallazgos.length > 0) {
    hasData = true;
    if (c.hallazgos.some(h => !isHallazgoNormal(h))) {
      altered = true;
    }
  }

  if (!hasData) return 'sin_evaluar';
  return altered ? 'alterado' : 'normal';
}

export type NordicSugerencia = 'siempre' | 'obligatoria' | 'molestia_actual' | 'antecedente' | 'sin_molestia';

const NORDIC_REGION_TO_KEY: Record<string, string> = {
  'Cuello': 'cuello',
  'Hombro derecho': 'hombro_derecho',
  'Hombro izquierdo': 'hombro_izquierdo',
  'Codo o antebrazo': 'codo_antebrazo',
  'Muñeca o mano': 'muneca_mano',
  'Espalda alta (dorsal)': 'espalda_alta',
  'Espalda baja (lumbar)': 'espalda_baja',
  'Cadera o muslo': 'cadera_muslo',
  'Rodilla': 'rodilla',
  'Tobillo o pie': 'tobillo_pie'
};

export function calcularSugerenciaNordico(
  nordicRegion: string,
  lado: ManiobraLado,
  anexoB: any
): NordicSugerencia {
  if (nordicRegion === 'Siempre se explora') return 'siempre';
  const key = NORDIC_REGION_TO_KEY[nordicRegion];
  if (!key || !anexoB?.regiones?.[key]) return 'sin_molestia';

  const r = anexoB.regiones[key];
  if (r.molestias_12m !== 'si') return 'sin_molestia';

  // Respetar el lado indicado en el Nórdico cuando la región tiene campo lado
  if (lado !== '—' && r.lado) {
    const rLado = String(r.lado).toLowerCase();
    if (lado === 'Der' && rLado === 'izquierdo') return 'sin_molestia';
    if (lado === 'Izq' && rLado === 'derecho') return 'sin_molestia';
  }

  if (r.molestias_7d === 'si' && r.impidio_trabajo === 'si') return 'obligatoria';
  if (r.molestias_7d === 'si') return 'molestia_actual';
  return 'antecedente';
}

export function calcularResumenSugerido(
  maniobrasMap: Record<string, ManiobraCaptura>,
  edad?: number | string | null,
  sexo?: string | null
): Record<string, 'Sin evaluar' | 'Normal' | 'Alterado'> {
  const result: Record<string, 'Sin evaluar' | 'Normal' | 'Alterado'> = {};
  for (const reg of RESUMEN_16_REGIONES) {
    const items = MANIOBRAS_CATALOG.filter(m => m.resumenKey === reg.key);
    let anyEvaluated = false;
    let anyAltered = false;
    for (const item of items) {
      const ev = evaluarManiobraAlterada(item, maniobrasMap[item.id], edad, sexo);
      if (ev === 'alterado') {
        anyEvaluated = true;
        anyAltered = true;
        break;
      }
      if (ev === 'normal') {
        anyEvaluated = true;
      }
    }
    result[reg.key] = anyAltered ? 'Alterado' : anyEvaluated ? 'Normal' : 'Sin evaluar';
  }
  return result;
}
