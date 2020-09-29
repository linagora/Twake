import React from 'react';

import Globals from 'services/Globals.js';

export default class LocalStorage {
  static setItem(key, value) {
    value = JSON.stringify(value);
    Globals.localStorageSetItem(key, value);
  }
  static getItem(key, callback) {
    let value = Globals.localStorageGetItem(key);

    if (!value) {
      if (callback) callback(value);
      return;
    }
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = null;
      console.log(e);
    }
    if (callback) callback(value);
    return value;
  }
  static clear() {
    Globals.localStorageClear();
  }
}
