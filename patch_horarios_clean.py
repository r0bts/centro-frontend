import re

with open('src/app/models/deportivo/actividad.model.ts', 'r') as f:
    ts = f.read()

# 1. HorarioEntrenamiento
target_he = r'area_id\?: number \| null;\s*// FK → areas\.id \(área con layout mapeado\)'
repl_he = 'area_id?: number | null;         // FK → areas.id\n  profesor_id?: number | null;\n  costo_interno?: number | null;'
ts = re.sub(target_he, repl_he, ts)

# 2. CreateHorarioRequest
target_cr = r'area_id\?: number \| null;'
# This might match multiple, but we ONLY want the one in CreateHorarioRequest.
# Let's be specific by replacing the exact block for CreateHorarioRequest
block_cr = """export interface CreateHorarioRequest {
  lugar?: string | null;
  dia_semana: number;              // 1–7
  hora_inicio: string;             // HH:MM
  hora_fin: string;                // HH:MM
  area_id?: number | null;
  is_active?: boolean;
}"""
repl_cr = """export interface CreateHorarioRequest {
  lugar?: string | null;
  dia_semana: number;              // 1–7
  hora_inicio: string;             // HH:MM
  hora_fin: string;                // HH:MM
  area_id?: number | null;
  profesor_id?: number | null;
  costo_interno?: number | null;
  is_active?: boolean;
}"""
if block_cr in ts:
    ts = ts.replace(block_cr, repl_cr)

# 3. WizardHorario
block_wh = """export interface WizardHorario {
  dia_semana: number;              // 1–7
  hora_inicio: string;
  hora_fin: string;
  lugar: string | null;            // texto libre (opcional)
  area_id: number | null;          // FK → areas.id (solo áreas con layout mapeado)
}"""
repl_wh = """export interface WizardHorario {
  dia_semana: number;              // 1–7
  hora_inicio: string;
  hora_fin: string;
  lugar: string | null;            // texto libre (opcional)
  area_id: number | null;          // FK → areas.id
  profesor_id: number | null;
  costo_interno: number | null;
}"""
if block_wh in ts:
    ts = ts.replace(block_wh, repl_wh)

with open('src/app/models/deportivo/actividad.model.ts', 'w') as f:
    f.write(ts)
print("Cleanly patched actividad.model.ts")
