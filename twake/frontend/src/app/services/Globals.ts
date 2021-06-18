import environment from 'environment/environment';
import version from 'environment/version';
import * as Sentry from '@sentry/browser';
import LocalStorage from './LocalStorage';
import { EnvironmentType, EnvironmentVersionType } from 'app/environment/types';
import ServiceRegistry from './ServiceRegistry';

if (process.env.NODE_ENV === 'production' && (window as any).sentry_dsn) {
  Sentry.init({
    dsn: (window as any).sentry_dsn,
  });
}

(window as any).getBoundingClientRect = (element: Element) => {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x || rect.left,
    y: rect.y || rect.top,
  };
};

document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('dragenter', e => e.preventDefault());
document.body.addEventListener('drop', e => e.preventDefault());

class TwakeApp {
  window: Window;
  environment: EnvironmentType;
  version_detail: string;
  store_public_access_get_data: any;
  version: EnvironmentVersionType;
  services: any;
  api_root_url: string;

  constructor() {
    this.services = ServiceRegistry;
    this.environment = environment;
    this.version = version;
    this.window = window;
    this.api_root_url = this.environment.api_root_url || "";

    // FIXME: Deprecated, need to check all the places where the values are used
    Object.keys(environment).forEach(key => {
      if (!(this.window as any)[key]) {
        (this.window as any)[key] = (environment as any)[key];
      }
    });
    Object.keys(version).forEach(key => {
      (this.window as any)[key] = (version as any)[key];
    });

    this.version_detail = environment.version_detail;

    LocalStorage.getItem('api_root_url', (res: string) => {
      if (res) {
        this.api_root_url = res;
      }
    });

    this.store_public_access_get_data = undefined;
  }

  getDefaultLanguage(): string {
    return (navigator || {}).language || 'en';
  }
}

const app = new TwakeApp();
(window as any).TwakeApp = app;
export default app;
