import environment from 'environment/environment';
import version from 'environment/version';
import * as Sentry from '@sentry/browser';
import LocalStorage from './LocalStorage';

if (process.env.NODE_ENV === 'production' && window.sentry_dsn) {
  Sentry.init({
    dsn: window.sentry_dsn,
  });
}

window.getBoundingClientRect = element => {
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

document.body.addEventListener('dragover', e => {
  e.preventDefault();
});
document.body.addEventListener('dragenter', e => {
  e.preventDefault();
});
document.body.addEventListener('drop', e => {
  e.preventDefault();
});

class Globals {
  constructor() {
    this.services = {};

    this.isReactNative = false;

    this.polyfill();

    Object.keys(environment).forEach(key => {
      if (!this.window[key]) {
        this.window[key] = environment[key];
      }
    });
    Object.keys(version).forEach(key => {
      this.window[key] = version[key];
    });

    this.version_detail = window.version_detail;

    LocalStorage.getItem('api_root_url', res => {
      if (res) {
        this.window.api_root_url = res;
      }
    });

    this.device = null;
    this.store_public_access_get_data = undefined;
  }

  changeRootUrl(url) {
    url = (url.match(/https?:\/\/[a-zA-Z0-9._-]+/) || [])[0];
    if (url) {
      LocalStorage.setItem('api_root_url', url);
      this.window.api_root_url = url;
    }
  }

  getDevice(callback, noTimeout) {
    callback({});
  }

  getDefaultLanguage() {
    return (navigator || {}).language || 'en';
  }

  polyfill() {
    if (typeof window !== 'undefined') {
      this.window = window;
    }

    if (!this.window.addEventListener) {
      this.window.addEventListener = () => {};
      this.window.removeEventListener = () => {};
    }
    if (!this.window.document) {
      this.window.document = {
        hasFocus: () => {
          return true;
        },
      };
    }

    this.autobahn = {
      connect: () => {
        return {
          on: () => {},
        };
      },
    };

    if (typeof Audio != 'undefined') {
      this.Audio = Audio;
    }
    if (!this.Audio) {
      this.Audio = class Audio {
        play() {}

        stop() {}
      };
    }
  }
}

const globals = new Globals();
export default globals;
