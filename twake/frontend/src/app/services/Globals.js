// import AsyncStorage from '@react-native-community/async-storage';
// import SyncStorage from 'sync-storage';
// import { Platform, NativeModules } from 'react-native';
// var PushNotification = require('react-native-push-notification');
// import { MixpanelInstance } from 'react-native-mixpanel';
// const mixpanel = new MixpanelInstance(window.mixpanel_id);

import environment from 'environment/environment';
import version from 'environment/version';
import * as Sentry from '@sentry/browser';

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

    this.isReactNative = typeof AsyncStorage != 'undefined';

    if (typeof window !== 'undefined') {
      this.window = window;
    }

    Object.keys(environment).forEach(key => {
      if (!this.window[key]) {
        this.window[key] = environment[key];
      }
    });
    Object.keys(version).forEach(key => {
      this.window[key] = version[key];
    });

    this.version_detail = window.version_detail;

    this.localStorageGetItem('api_root_url', res => {
      if (res) {
        this.window.api_root_url = res;
      }
    });

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

    this.window.mixpanel_prefix = '';

    if (typeof MixpanelInstance != 'undefined') {
      // eslint-disable-line no-undef
      var mixpanel = undefined;
      mixpanel = new MixpanelInstance('8d6e53f2820846e3784fcfd4b308acab'); // eslint-disable-line no-undef
      if (this.isReactNative) {
        // eslint-disable-next-line no-undef
        if (mixpanel && Platform.OS === 'ios') {
          this.window.mixpanel_prefix = 'mobile_';

          (async () => {
            await mixpanel.initialize();
            this.window.mixpanel_enabled = true;
            this.window.mixpanel.people = this.window.mixpanel;
          })();

          this.window.mixpanel = mixpanel;
        } else {
          this.window.mixpanel_enabled = false;
        }
      }
    }

    // eslint-disable-next-line no-undef
    if (typeof PushNotification != 'undefined') {
      this.PushNotification = PushNotification; // eslint-disable-line no-undef
    }

    this.device = null;
    this.store_public_access_get_data = undefined;
  }

  changeRootUrl(url) {
    url = (url.match(/https?:\/\/[a-zA-Z0-9._-]+/) || [])[0];
    if (url) {
      this.localStorageSetItem('api_root_url', url);
      this.window.api_root_url = url;
    }
  }

  localStorageSetItem(key, value) {
    if (typeof SyncStorage != 'undefined') {
      // eslint-disable-next-line no-undef
      SyncStorage.set(key, value); // eslint-disable-line no-undef
    } else if (window && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  localStorageGetItem(key, callback) {
    // eslint-disable-next-line no-undef
    if (typeof SyncStorage != 'undefined') {
      const data = SyncStorage.get(key); // eslint-disable-line no-undef
      if (callback) {
        callback(data);
      }
      return data;
    } else if (window && window.localStorage) {
      if (callback) {
        callback(window.localStorage.getItem(key));
      }
      return window.localStorage.getItem(key);
    }
  }

  localStorageClear() {
    if (typeof SyncStorage != 'undefined') {
      SyncStorage.clear(); // eslint-disable-line no-undef
    } else if (window && window.localStorage) {
      window.localStorage.clear();
    }
  }

  getDevice(callback, noTimeout) {
    if (typeof PushNotification != 'undefined') {
      if (this.device && this.device.value) {
        callback(this.device);
      } else if (!noTimeout) {
        setTimeout(() => {
          this.getDevice(callback, true);
        }, 1000);
      } else {
        callback({});
      }
    } else {
      callback({});
    }
  }

  getDefaultLanguage() {
    // eslint-disable-next-line no-undef
    if (typeof NativeModules != 'undefined') {
      var locale = ((NativeModules.SettingsManager || {}).settings || {}).AppleLocale || 'en'; // eslint-disable-line no-undef
      if (!locale) {
        locale = (NativeModules.I18nManager || {}).localeIdentifier || 'en'; // eslint-disable-line no-undef
      }
      return locale;
    } else {
      return (navigator || {}).language || 'en';
    }
  }

  clearCookies() {
    // eslint-disable-next-line no-undef
    if (typeof Cookie != 'undefined') {
      Cookie.clear(); // eslint-disable-line no-undef
    }
  }
}

const globals = new Globals();
export default globals;
