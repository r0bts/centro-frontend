import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure, DocmgmtPermission } from '../../models/docmgmt.model';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepartmentLimitsService } from '../../../../services/department-limits.service';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './access-management.html',
  styleUrls: ['./access-management.scss']
})
export class AccessManagementComponent implements OnInit {
  private docmgmtService = inject(DocmgmtService);
  private deptLimitsService = inject(DepartmentLimitsService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  @Input() procedureId!: number;
  @Output() close = new EventEmitter<boolean>(); // Emit true if saved, false if cancelled

  procedure: DocmgmtProcedure | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  departments: any[] = [];

  // Department search
  searchDeptTerm = '';
  deptSearchResults: any[] = [];

  get selectedDepartments(): any[] {
    return this.departments.filter(d => d.selected);
  }

  searchDept() {
    if (!this.searchDeptTerm.trim()) {
      this.deptSearchResults = [];
      return;
    }
    const term = this.searchDeptTerm.toLowerCase();
    this.deptSearchResults = this.departments.filter(d => !d.selected && d.name.toLowerCase().includes(term));
  }

  addDepartment(dept: any) {
    dept.selected = true;
    this.searchDeptTerm = '';
    this.deptSearchResults = [];
  }

  removeDepartment(dept: any) {
    dept.selected = false;
  }

  // Dummy user search for now since there's no UsersService defined yet
  searchUserTerm = '';
  usersSearchResults: any[] = [];
  selectedUsers: any[] = []; // { id, name, permId }

  // Original list to calculate diffs
  originalPermissions: DocmgmtPermission[] = [];

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.deptLimitsService.getDepartments().subscribe({
      next: (res) => {
        if (res.success) {
          this.departments = res.data.map(d => ({
            id: d.department_id,
            name: d.department_name,
            icon: 'bi-building',
            selected: false,
            original: false,
            permId: null
          }));
        }
        
        // After loading departments, load the procedure
        if (this.procedureId) {
          this.loadProcedure(this.procedureId);
        } else {
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        }
      },
      error: () => {
        this.error = 'Error al cargar departamentos.';
        this.loading = false;
      }
    });
  }

  loadProcedure(id: number) {
    this.docmgmtService.getProcedure(id).subscribe({
      next: (res: any) => {
        if (res.docmgmtProcedure) {
          this.procedure = res.docmgmtProcedure;
          this.originalPermissions = res.docmgmtProcedure.docmgmt_procedure_permissions || [];
          this.mapPermissions();
        } else {
          this.error = 'Procedimiento no encontrado.';
        }
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.error = 'Error de conexión.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  mapPermissions() {
    this.originalPermissions.forEach(p => {
      if (p.permission_type === 'department') {
        const dept = this.departments.find(d => d.id === p.department_id);
        if (dept) {
          dept.selected = true;
          dept.original = true;
          dept.permId = p.id || null;
        }
      } else if (p.permission_type === 'user') {
        const userObj = {
          id: p.user_id,
          name: 'Cargando...', // Placeholder until fetched
          permId: p.id,
          original: true
        };
        this.selectedUsers.push(userObj);
        
        if (p.user_id) {
          this.userService.getUserById(p.user_id.toString()).subscribe({
            next: (res: any) => {
              if (res && res.user) {
                userObj.name = `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.username;
                this.cdr.detectChanges();
              } else {
                userObj.name = 'Usuario ' + p.user_id;
                this.cdr.detectChanges();
              }
            },
            error: () => {
              userObj.name = 'Usuario ' + p.user_id;
              this.cdr.detectChanges();
            }
          });
        }
      }
    });
  }

  toggleDepartment(dept: any) {
    dept.selected = !dept.selected;
  }

  searchUserTimer: any;

  searchUser() {
    if (this.searchUserTimer) {
      clearTimeout(this.searchUserTimer);
    }
    
    this.searchUserTimer = setTimeout(() => {
      if (!this.searchUserTerm.trim() || this.searchUserTerm.length < 2) {
        this.usersSearchResults = [];
        this.cdr.detectChanges();
        return;
      }
      
      this.userService.getAllUsers(20, 1, this.searchUserTerm).subscribe({
        next: (users) => {
          this.usersSearchResults = users.map(u => ({
            ...u,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email
          }));
          this.cdr.detectChanges();
        },
        error: () => {
          this.usersSearchResults = [];
          this.cdr.detectChanges();
        }
      });
    }, 300);
  }

  addUser(user: any) {
    if (!this.selectedUsers.find(u => u.id === user.id)) {
      this.selectedUsers.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        permId: null,
        original: false
      });
    }
    this.searchUserTerm = '';
    this.usersSearchResults = [];
  }

  removeUser(index: number) {
    this.selectedUsers.splice(index, 1);
  }

  getInitials(name: string): string {
    return name.substring(0, 2).toUpperCase();
  }

  goBack(saved = false) {
    this.close.emit(saved);
  }

  saveAccess() {
    if (!this.procedure) return;
    this.saving = true;

    const observables: Observable<any>[] = [];

    // Calculate diff for departments
    for (const dept of this.departments) {
      if (dept.selected && !dept.original) {
        // Add
        observables.push(this.docmgmtService.addPermission({
          procedure_id: this.procedure.id!,
          permission_type: 'department',
          department_id: dept.id
        }).pipe(catchError(e => of(e))));
      } else if (!dept.selected && dept.original && dept.permId) {
        // Remove
        observables.push(this.docmgmtService.deletePermission(dept.permId).pipe(catchError(e => of(e))));
      }
    }

    // Calculate diff for users
    // Added
    for (const user of this.selectedUsers) {
      if (!user.original) {
        observables.push(this.docmgmtService.addPermission({
          procedure_id: this.procedure.id!,
          permission_type: 'user',
          user_id: user.id
        }).pipe(catchError(e => of(e))));
      }
    }
    // Removed
    for (const p of this.originalPermissions) {
      if (p.permission_type === 'user') {
        const stillSelected = this.selectedUsers.find(u => u.id === p.user_id);
        if (!stillSelected) {
          if (p.id) observables.push(this.docmgmtService.deletePermission(p.id).pipe(catchError(e => of(e))));
        }
      }
    }

    if (observables.length === 0) {
      this.saving = false;
      this.goBack();
      return;
    }

    forkJoin(observables).subscribe({
      next: () => {
        this.saving = false;
        this.goBack(true);
      },
      error: () => {
        this.error = 'Ocurrió un error al guardar los permisos.';
        this.saving = false;
      }
    });
  }

  get selectedDepartmentsCount(): number {
    return this.departments.filter(d => d.selected).length;
  }
}
