import Globals from 'services/Globals.js';

class Electron {
  constructor() {
    if (this.isElectron()) {
      document.addEventListener('keydown', function (e) {
        if (e.which === 123) {
          Globals.window.electron.remote.getCurrentWindow().toggleDevTools();
        } else if (e.which === 116) {
          Globals.window.location.reload();
        }
      });
    }
  }

  isElectron() {
    return Globals.window.electron != undefined;
  }

  setBadge(value) {
    if (!this.isElectron()) return;
    try {
      if (
        Globals.window.electron &&
        Globals.window.electron.remote &&
        Globals.window.electron.remote.app &&
        Globals.window.electron.remote.app.dock
      ) {
        Globals.window.electron.remote.app.dock.setBadge(value);
      }
    } catch (err) {
      console.log('No electron app available for setting dock badge');
    }
  }
}

const instanceElectron = new Electron();
export default instanceElectron;
