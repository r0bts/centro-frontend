import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure, DocmgmtPermission } from '../../models/docmgmt.model';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepartmentLimitsService } from '../../../../services/department-limits.service';
import { UserService } from '../../../../services/user.service';
import { ContentMenu } from '../../../../components/content-menu/content-menu';

@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ContentMenu],
  templateUrl: './access-management.html',
  styleUrls: ['./access-management.scss']
})
export class AccessManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private docmgmtService = inject(DocmgmtService);
  private deptLimitsService = inject(DepartmentLimitsService);
  private userService = inject(UserService);

  procedure: DocmgmtProcedure | null = null;
  loading = true;
  saving = false;
  error: string | null = null;

  departments: any[] = [];

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
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.loadProcedure(+id);
        } else {
          this.loading = false;
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
        this.loading = false;
      },
      error: () => {
        this.error = 'Error de conexión.';
        this.loading = false;
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
        this.selectedUsers.push({
          id: p.user_id,
          name: 'Usuario ' + p.user_id, // Placeholder since we don't have user names joined
          permId: p.id,
          original: true
        });
      }
    });
  }

  toggleDepartment(dept: any) {
    dept.selected = !dept.selected;
  }

  searchUser() {
    if (!this.searchUserTerm.trim() || this.searchUserTerm.length < 3) {
      this.usersSearchResults = [];
      return;
    }
    
    this.userService.getAllUsers(20, 1, this.searchUserTerm).subscribe({
      next: (users) => {
        this.usersSearchResults = users.map(u => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`.trim()
        }));
      },
      error: () => {
        this.usersSearchResults = [];
      }
    });
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

  goBack() {
    this.location.back();
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
        this.goBack();
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
