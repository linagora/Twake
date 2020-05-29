// import AsyncStorage from '@react-native-community/async-storage';
// import Cookie from 'react-native-cookie';
// import { NativeModules } from 'react-native'
// var PushNotification = require('react-native-push-notification');
// import { MixpanelInstance } from 'react-native-mixpanel';
// const mixpanel = new MixpanelInstance('8d6e53f2820846e3784fcfd4b308acab');

class Globals {
  constructor() {
    this.VERSION_DETAIL = '1.2.000';

    this.services = {};

    this.isReactNative = typeof AsyncStorage != 'undefined';

    if (typeof window != 'undefined') {
      this.window = window;
    }
    if (!this.window) {
      this.window = {};

      this.window.API_ROOT_URL = 'https://app.twakeapp.com';

      this.localStorageGetItem('api_root_url', res => {
        if (res) {
          this.window.API_ROOT_URL = res;
        }
      });
    }

    if (!this.window.addEventListener) {
      (this.window.addEventListener = () => {}), (this.window.removeEventListener = () => {});
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
        return { on: () => {} };
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
      var mixpanel = undefined;
      mixpanel = new MixpanelInstance('8d6e53f2820846e3784fcfd4b308acab');
      if (this.isReactNative) {
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

    if (typeof PushNotification != 'undefined') {
      this.PushNotification = PushNotification;
    }

    this.device = null;
  }

  changeRootUrl(url) {
    url = (url.match(/https?:\/\/[a-zA-Z0-9._-]+/) || [])[0];
    if (url) {
      this.localStorageSetItem('api_root_url', url);
      this.window.API_ROOT_URL = url;
    }
  }

  request(type, route, data, options, callback, timeout) {
    if (this.isReactNative) {
      fetch(route, {
        credentials: 'same-origin',
        method: type,
        timeout: timeout || 10000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: type == 'POST' ? data || '{}' : undefined,
      })
        .then(response => {
          response.text().then(function(text) {
            if (callback) {
              callback(text);
            }
          });
        })
        .catch(err => {
          if (callback) {
            callback(JSON.stringify({ errors: [err] }));
          }
        });
    } else {
      var xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status !== 200 && callback) {
          callback(JSON.stringify({ errors: [xmlhttp.status] }));
        } else if (xmlhttp.readyState == XMLHttpRequest.DONE && callback) {
          callback(xmlhttp.responseText);
        }
      };
      xmlhttp.open(type, route, true);
      xmlhttp.withCredentials = true;
      xmlhttp.setRequestHeader('Content-Type', 'application/json');
      xmlhttp.send(data);
    }
  }

  localStorageSetItem(key, value) {
    if (typeof AsyncStorage != 'undefined') {
      AsyncStorage.setItem(key, value);
    } else if (window && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  localStorageGetItem(key, callback) {
    if (typeof AsyncStorage != 'undefined') {
      const value = AsyncStorage.getItem(key).then(value => {
        callback(value);
      });
      return value;
    } else if (window && window.localStorage) {
      if (callback) {
        callback(window.localStorage.getItem(key));
      }
      return window.localStorage.getItem(key);
    }
  }

  localStorageClear() {
    if (typeof AsyncStorage != 'undefined') {
      AsyncStorage.clear();
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
    if (typeof NativeModules != 'undefined') {
      var locale = ((NativeModules.SettingsManager || {}).settings || {}).AppleLocale || 'en';
      if (!locale) {
        locale = (NativeModules.I18nManager || {}).localeIdentifier || 'en';
      }
      return locale;
    } else {
      return (navigator || {}).language || 'en';
    }
  }

  clearCookies() {
    if (typeof Cookie != 'undefined') {
      Cookie.clear();
    }
  }
}

const globals = new Globals();
export default globals;
