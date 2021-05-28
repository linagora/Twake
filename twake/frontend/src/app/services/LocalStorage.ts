export default class LocalStorage {
  static prefix: string = 'twake:';

  static setItem(key: string, value: any) {
    key = LocalStorage.prefix + key;
    value = JSON.stringify(value);
    window.localStorage.setItem(key, value);
  }

  static async getItem(key: string, callback?: Function) {
    key = LocalStorage.prefix + key;

    return new Promise(resolve => {
      if (callback) {
        callback(window.localStorage.getItem(key));
      }
      let value = window.localStorage.getItem(key);

      if (!value) {
        if (callback) callback(value);
        resolve(value);
        return;
      }
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = null;
        console.log(e);
      }
      if (callback) callback(value);
      resolve(value);
      return value;
    });
  }

  static clear() {
    for (var i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const depreciatedKeysRemove =
          ['twake-collections-db', 'm_input', 'language', 'jwt', 'autoload_workspaces'].indexOf(
            key,
          ) >= 0 || key.indexOf(':channel') > 0;
        if (key.indexOf(LocalStorage.prefix) === 0 || depreciatedKeysRemove)
          window.localStorage.removeItem(key);
      }
    }
    window.localStorage.clear();
  }
}
