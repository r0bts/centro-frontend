path = 'src/app/components/deportivo/actividades/deportivo-actividades.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_directive = """import { Directive, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';

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
}"""

new_directive = """import { Directive, ElementRef, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';

@Directive({
  selector: '[bsDropdownState]',
  standalone: true
})
export class BsDropdownStateDirective implements OnInit, OnDestroy {
  @Output() bsDropdownState = new EventEmitter<boolean>();
  private isOpen = false;
  
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('show.bs.dropdown', () => { this.isOpen = true; this.bsDropdownState.emit(true); });
    this.el.nativeElement.addEventListener('hidden.bs.dropdown', () => { this.isOpen = false; this.bsDropdownState.emit(false); });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape() {
    if (this.isOpen) {
      const toggle = this.el.nativeElement.querySelector('[data-bs-toggle="dropdown"]');
      if (toggle) {
        // Force click to close if Bootstrap missed it
        toggle.click();
      }
    }
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('show.bs.dropdown', () => this.bsDropdownState.emit(true));
    this.el.nativeElement.removeEventListener('hidden.bs.dropdown', () => this.bsDropdownState.emit(false));
  }
}"""

ts = ts.replace(old_directive, new_directive)

with open(path, 'w') as f:
    f.write(ts)
print("Updated directive with Escape listener")
