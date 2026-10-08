path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

directive = """import { Directive, ElementRef, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[bsDropdownState]',
  standalone: true
})
export class BsDropdownStateDirective implements OnInit, OnDestroy {
  @Output() bsDropdownState = new EventEmitter<boolean>();
  
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('show.bs.dropdown', () => this.bsDropdownState.emit(true));
    this.el.nativeElement.addEventListener('hidden.bs.dropdown', () => this.bsDropdownState.emit(false));
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('show.bs.dropdown', () => this.bsDropdownState.emit(true));
    this.el.nativeElement.removeEventListener('hidden.bs.dropdown', () => this.bsDropdownState.emit(false));
  }
}
"""

ts = ts.replace("import { CommonModule } from '@angular/common';", "import { CommonModule } from '@angular/common';\n" + directive)
ts = ts.replace("imports: [CommonModule, FormsModule, ActividadWizardComponent],", "imports: [CommonModule, FormsModule, ActividadWizardComponent, BsDropdownStateDirective],")

state_methods = """  dropdownState = signal<Record<number, boolean>>({});

  setDropdownState(id: number, state: boolean) {
    this.dropdownState.update(s => ({ ...s, [id]: state }));
  }

  isDropdownOpen(id: number): boolean {
    return this.dropdownState()[id] || false;
  }
"""

ts = ts.replace("  viewMode = signal<'grid'|'list'>('grid');", "  viewMode = signal<'grid'|'list'>('grid');\n" + state_methods)

with open(path, 'w') as f:
    f.write(ts)
print("Updated TS for Dropdown State")
