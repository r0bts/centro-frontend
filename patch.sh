sed -i '' 's/import { CommonModule } from .@angular\/common.;/import { CommonModule } from "\@angular\/common";\
import { FormsModule } from "\@angular\/forms";/g' src/app/components/deportivo/actividades/deportivo-actividades.ts

sed -i '' 's/imports: \[CommonModule, ActividadWizardComponent\]/imports: \[CommonModule, FormsModule, ActividadWizardComponent\]/g' src/app/components/deportivo/actividades/deportivo-actividades.ts

sed -i '' 's/filterClub.set($event)/filterClub.set($any($event))/g' src/app/components/deportivo/actividades/deportivo-actividades.html
sed -i '' 's/filterArea.set($event)/filterArea.set($any($event))/g' src/app/components/deportivo/actividades/deportivo-actividades.html
sed -i '' 's/filterDay.set($event)/filterDay.set($any($event))/g' src/app/components/deportivo/actividades/deportivo-actividades.html
