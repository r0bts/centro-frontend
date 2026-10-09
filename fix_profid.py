import re

path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

bad_code = """            const pId = this.filterProfesorId();
            const profId = h.profesor_id || eq.coach_id || act.profesor_id;
            if (pId && profId !== pId) continue;"""

good_code = """            const pId = this.filterProfesorId();
            if (pId && profId !== pId) continue;"""

ts = ts.replace(bad_code, good_code)

with open(path, 'w') as f:
    f.write(ts)
