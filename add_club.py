ts_path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(ts_path, 'r') as f:
    ts = f.read()

get_club = """  getClubName(clubId?: number): string {
    if (!clubId) return 'Todas las sedes';
    const clubes = this.formData()?.acceso_clubes || [];
    const club = clubes.find(c => c.id === clubId);
    return club ? club.name : 'Todas las sedes';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────"""

ts = ts.replace('  // ── Lifecycle ──────────────────────────────────────────────────────────────', get_club)

with open(ts_path, 'w') as f:
    f.write(ts)
print("Added getClubName")
