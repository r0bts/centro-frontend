import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocmgmtService } from '../../docmgmt.service';
import { DocmgmtProcedure } from '../../models/docmgmt.model';
import { AuthService } from '../../../../services/auth.service';

import { ContentMenu } from '../../../../components/content-menu/content-menu';
import { AccessManagementComponent } from '../access-management/access-management';
import { UserService } from '../../../../services/user.service';
import { DepartmentLimitsService } from '../../../../services/department-limits.service';

@Component({
  selector: 'app-procedure-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ContentMenu, AccessManagementComponent],
  templateUrl: './procedure-detail.html',
  styleUrls: ['./procedure-detail.scss']
})
export class ProcedureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private docmgmtService = inject(DocmgmtService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private userService = inject(UserService);
  private departmentLimitsService = inject(DepartmentLimitsService);

  canEdit = false;
  showAccessModal = false;

  procedure: DocmgmtProcedure | null = null;
  loading = true;
  error: string | null = null;
  
  selectedDocument: any = null;
  selectedDocSafeUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    this.canEdit = this.authService.hasPermission('procedimientos', 'update');

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = +idParam;
      if (isNaN(id)) {
        window.location.href = '/docmgmt';
        return;
      }
      this.loadProcedure(id);
    }
  }

  loadProcedure(id: number) {
    this.docmgmtService.getProcedure(id).subscribe({
      next: (res: any) => {
        if (res.docmgmtProcedure) {
          this.procedure = res.docmgmtProcedure;
          if (this.procedure?.docmgmt_procedure_documents && this.procedure.docmgmt_procedure_documents.length > 0) {
            this.selectDocument(this.procedure.docmgmt_procedure_documents[0]);
          } else {
            this.selectedDocument = null;
            this.selectedDocSafeUrl = null;
          }
          
          if (this.procedure?.docmgmt_procedure_permissions) {
            const hasDepts = this.procedure.docmgmt_procedure_permissions.some((p: any) => p.permission_type === 'department');
            if (hasDepts) {
              this.departmentLimitsService.getDepartments().subscribe((res: any) => {
                const depts = res.data;
                this.procedure!.docmgmt_procedure_permissions!.forEach((p: any) => {
                  if (p.permission_type === 'department') {
                    const dept = depts.find((d: any) => d.department_id === p.department_id);
                    p.displayName = dept ? dept.department_name : 'Depto ' + p.department_id;
                  }
                });
                this.cdr.detectChanges();
              });
            }
            
            this.procedure.docmgmt_procedure_permissions.forEach((p: any) => {
              if (p.permission_type === 'department') {
                p.displayName = 'Cargando...';
              } else if (p.permission_type === 'user') {
                p.displayName = 'Cargando...';
                if (p.user_id) {
                  this.userService.getUserById(p.user_id.toString()).subscribe({
                    next: (resUser: any) => {
                      if (resUser && resUser.user) {
                        p.displayName = `${resUser.user.firstName || ''} ${resUser.user.lastName || ''}`.trim() || resUser.user.username;
                      } else {
                        p.displayName = 'Usuario ' + p.user_id;
                      }
                      this.cdr.detectChanges();
                    },
                    error: () => {
                      p.displayName = 'Usuario ' + p.user_id;
                      this.cdr.detectChanges();
                    }
                  });
                }
              }
            });
          }
        } else {
          this.error = 'Procedimiento no encontrado.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error de conexión.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDownloadUrl(fileName: string): string {
    if (!this.procedure) return '#';
    return this.docmgmtService.getDownloadUrl(this.procedure.id!, fileName);
  }

  getFileIconClass(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'bi-filetype-pdf text-danger';
    if (ext === 'doc' || ext === 'docx') return 'bi-filetype-docx text-primary';
    if (ext === 'xls' || ext === 'xlsx') return 'bi-filetype-xlsx text-success';
    return 'bi-file-earmark text-secondary';
  }

  getInitials(name: string): string {
    return name.substring(0, 2).toUpperCase();
  }

  openAccessModal() {
    this.showAccessModal = true;
  }

  closeAccessModal(saved: boolean) {
    this.showAccessModal = false;
    if (saved && this.procedure?.id) {
      this.loadProcedure(this.procedure.id);
    }
  }

  selectDocument(doc: any) {
    this.selectedDocument = doc;
    const rawUrl = this.getDownloadUrl(doc.file_name);
    this.selectedDocSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  isPdf(fileName: string): boolean {
    return fileName?.toLowerCase().endsWith('.pdf') || false;
  }

  isImage(fileName: string): boolean {
    const ext = fileName?.toLowerCase().split('.').pop() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  }
}
