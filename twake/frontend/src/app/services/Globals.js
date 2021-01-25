// import AsyncStorage from '@react-native-community/async-storage';
// import SyncStorage from 'sync-storage';
// import Cookie from 'react-native-cookie';
// import { Platform, NativeModules } from 'react-native';
// var PushNotification = require('react-native-push-notification');
// import { MixpanelInstance } from 'react-native-mixpanel';

import environment from 'environment/environment';
import version from 'environment/version';


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
    this.window.mixpanel_enabled = false;
    window.mixpanel_enabled = false;
    
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

      // eslint-disable-next-line no-undef
    if (typeof PushNotification != 'undefined') {
      this.PushNotification = PushNotification; // eslint-disable-line no-undef
    }

    this.device = null;
  }

  changeRootUrl(url) {
    url = (url.match(/https?:\/\/[a-zA-Z0-9._-]+/) || [])[0];
    if (url) {
      this.localStorageSetItem('api_root_url', url);
      this.window.api_root_url = url;
    }
  }

  request(type, route, data, options, callback, timeout) {
    this.getAllCookies(cookies => {
      if (this.isReactNative) {
        fetch(route, {
          credentials: 'same-origin',
          method: type,
          timeout: timeout || 10000,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'All-Cookies': JSON.stringify(cookies),
          },
          body: type == 'POST' ? data || '{}' : undefined,
        })
          .then(response => {
            this.retrieveRequestCookies(response.headers['All-Cookies']);
            response.text().then(function (text) {
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
        xmlhttp.onreadystatechange = () => {
          if (xmlhttp.readyState === 4 && xmlhttp.status !== 200 && callback) {
            callback(JSON.stringify({ errors: [xmlhttp.status], _request_failed: true }));
          } else if (xmlhttp.readyState == XMLHttpRequest.DONE && callback) {
            this.retrieveRequestCookies(xmlhttp.getResponseHeader('All-Cookies'));
            callback(xmlhttp.responseText);
          }
        };
        xmlhttp.open(type, route, true);
        xmlhttp.withCredentials = true;
        xmlhttp.setRequestHeader('Content-Type', 'application/json');
        xmlhttp.setRequestHeader('All-Cookies', JSON.stringify(cookies));
        xmlhttp.send(data);
      }
    });
  }

  getAllCookies(callback) {
    this.localStorageGetItem('all-cookies', res => {
      let final = [];
      try {
        res = JSON.parse(res);
        res = res || {};
        Object.values(res).forEach(a => {
          if (a[2] * 1000 > new Date().getTime()) {
            final.push(a);
          }
        });
      } catch (error) {
        final = [];
      }
      callback(final);
    });
  }

  retrieveRequestCookies(cookies) {
    try {
      if (cookies) {
        cookies = JSON.parse(cookies);
        this.localStorageGetItem('all-cookies', res => {
          res = JSON.parse(res);
          res = res || {};
          cookies.forEach(item => {
            res[item[0]] = item;
            if (!item[1] && res[item[0]]) {
              delete res[item[0]];
            }
          });
          this.localStorageSetItem('all-cookies', JSON.stringify(res));
        });
      }
    } catch (err) {
      console.error('Error while reading cookies from: ' + cookies, err);
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
