import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (!environment.production) {
  // Fallback for dev-only JIT paths triggered by third-party/runtime flows.
  import('@angular/compiler');
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
