ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

get_club_name = """  getClubName(clubId: number): string {
    const clubes = this.formData()?.acceso_clubes || [];
    const club = clubes.find(c => c.id === clubId);
    return club ? club.name : 'Todas las sedes';
  }

  // ── Filtros y carga ────────────────────────────────────────────────────────"""

ts = ts.replace('  // ── Filtros y carga ────────────────────────────────────────────────────────', get_club_name)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Added getClubName to TS")
