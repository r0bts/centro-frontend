html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    html = f.read()

# Replace <div class="wizard-overlay"> with <div class="wizard-overlay" (click)="onOverlayClick($event)">
html = html.replace('<div class="wizard-overlay">', '<div class="wizard-overlay" (click)="onOverlayClick($event)">')

with open(html_path, 'w') as f:
    f.write(html)
print("Updated HTML")
