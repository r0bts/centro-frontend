path = 'src/app/services/deportivo/actividad.service.ts'
with open(path, 'r') as f:
    ts = f.read()

import re

old_import = "import { HttpClient, HttpParams } from '@angular/common/http';"
new_import = "import { HttpClient, HttpParams } from '@angular/common/http';\nimport { shareReplay } from 'rxjs/operators';"

ts = ts.replace(old_import, new_import)

old_form_data = """  getFormData(): Observable<ActividadFormDataResponse> {
    return this.http.get<ActividadFormDataResponse>(`${this.base}/actividades/form-data`);
  }"""

new_form_data = """  private formDataCache$: Observable<ActividadFormDataResponse> | null = null;

  getFormData(forceRefresh = false): Observable<ActividadFormDataResponse> {
    if (!this.formDataCache$ || forceRefresh) {
      this.formDataCache$ = this.http.get<ActividadFormDataResponse>(`${this.base}/actividades/form-data`).pipe(
        shareReplay(1)
      );
    }
    return this.formDataCache$;
  }"""

ts = ts.replace(old_form_data, new_form_data)

with open(path, 'w') as f:
    f.write(ts)
print("Updated service with cache")
