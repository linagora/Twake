import React from 'react';

import Globals from 'services/Globals.js';

export default class LocalStorage {
  static setItem(key, value) {
    value = JSON.stringify(value);
    Globals.localStorageSetItem(key, value);
  }
  static getItem(key, callback) {
    if (callback) {
      Globals.localStorageGetItem(key, value => {
        if (!value) {
          callback(value);
          return;
        }
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = null;
          console.log(e);
        }
        callback(value);
      });
    }
  }
  static clear() {
    Globals.localStorageClear();
  }
}
