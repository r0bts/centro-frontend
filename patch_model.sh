sed -i '' '/criterios_evaluacion?: CriterioEvaluacion\[\];/a\
  historial_costos?: HistorialCosto\[\];\
' src/app/models/deportivo/actividad.model.ts

sed -i '' '/export interface CriterioEvaluacion {/i\
export interface HistorialCosto {\
  id: number;\
  costo: number;\
  fecha_inicio: string;\
  fecha_fin?: string | null;\
}\
\
' src/app/models/deportivo/actividad.model.ts

sed -i '' '/monto?: number;/a\
  costo_interno?: number;\
' src/app/models/deportivo/actividad.model.ts

sed -i '' '/monto?: number | null;/a\
  costo_interno?: number | null;\
' src/app/models/deportivo/actividad.model.ts
