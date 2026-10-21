path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

# 1. Add effect to imports if missing
if 'effect,' not in ts and ' effect ' not in ts and 'effect }' not in ts:
    ts = ts.replace('signal,\n', 'signal,\n  effect,\n')

# 2. Update viewMode initialization
old_viewMode = "  viewMode = signal<'grid' | 'list' | 'calendar'>('grid');"
new_viewMode = """  viewMode = signal<'grid' | 'list' | 'calendar'>(
    (localStorage.getItem('centro_actividades_view_mode') as any) || 'grid'
  );

  constructor() {
    effect(() => {
      localStorage.setItem('centro_actividades_view_mode', this.viewMode());
    });
  }"""

ts = ts.replace(old_viewMode, new_viewMode)

with open(path, 'w') as f:
    f.write(ts)
print("Added view mode persistence")
