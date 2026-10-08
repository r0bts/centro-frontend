path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

method = """  getExtraInstructoresNames(profs: number[]): string {
    return profs.slice(2).map(id => this.getInstructorName(id)).join(', ');
  }"""

ts = ts.replace("  getInstructorName(id: number): string {", method + "\n\n  getInstructorName(id: number): string {")

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS")
