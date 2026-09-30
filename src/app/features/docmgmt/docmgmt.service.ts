import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocmgmtProcedure, DocmgmtDocument, DocmgmtPermission } from './models/docmgmt.model';

@Injectable({
  providedIn: 'root'
})
export class DocmgmtService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Procedures
  getProcedures(): Observable<{docmgmtProcedures: DocmgmtProcedure[]}> {
    return this.http.get<{docmgmtProcedures: DocmgmtProcedure[]}>(`${this.apiUrl}/docmgmt-procedures`);
  }

  getProcedure(id: number): Observable<{docmgmtProcedure: DocmgmtProcedure}> {
    return this.http.get<{docmgmtProcedure: DocmgmtProcedure}>(`${this.apiUrl}/docmgmt-procedures/${id}`);
  }

  createProcedure(data: Partial<DocmgmtProcedure>): Observable<{docmgmtProcedure: DocmgmtProcedure, success: boolean}> {
    return this.http.post<{docmgmtProcedure: DocmgmtProcedure, success: boolean}>(`${this.apiUrl}/docmgmt-procedures`, data);
  }

  updateProcedure(id: number, data: Partial<DocmgmtProcedure>): Observable<{docmgmtProcedure: DocmgmtProcedure, success: boolean}> {
    return this.http.put<{docmgmtProcedure: DocmgmtProcedure, success: boolean}>(`${this.apiUrl}/docmgmt-procedures/${id}`, data);
  }

  deleteProcedure(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/docmgmt-procedures/${id}`);
  }

  // Documents
  uploadDocument(procedureId: number, file: File): Observable<{success: boolean}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{success: boolean}>(`${this.apiUrl}/docmgmt-procedure-documents/add/${procedureId}`, formData);
  }

  deleteDocument(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/docmgmt-procedure-documents/${id}`);
  }

  // Permissions
  addPermission(data: Partial<DocmgmtPermission>): Observable<{permission: DocmgmtPermission, success: boolean}> {
    return this.http.post<{permission: DocmgmtPermission, success: boolean}>(`${this.apiUrl}/docmgmt-procedure-permissions`, data);
  }

  deletePermission(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/docmgmt-procedure-permissions/${id}`);
  }

  // Helper for downloading a document
  getDownloadUrl(procedureId: number, fileName: string): string {
    // Assuming documents are served from the webroot/uploads folder
    const baseUrl = this.apiUrl.replace('/api', '');
    return `${baseUrl}/uploads/docmgmt/${procedureId}/${fileName}`;
  }
}
