import Globals from 'services/Globals.js';

class Electron {
  constructor() {
    if (this.isElectron()) {
      document.addEventListener('keydown', function (e) {
        if (e.which === 123) {
          Globals.window.electron.remote.getCurrentWindow().toggleDevTools();
        } else if (e.which === 116) {
          location.reload();
        }
      });
    }
  }

  isElectron() {
    return Globals.window.electron != undefined;
  }

  isWindow() {
    if (!this.isElectron()) return false;
    return Globals.window.electron.remote.process.platform != 'darwin';
  }

  closeWindow() {
    if (!this.isElectron()) return;
    var w = Globals.window.electron.remote.getCurrentWindow();
    w.close();
  }

  minimizeWindow() {
    if (!this.isElectron()) return;
    var w = Globals.window.electron.remote.getCurrentWindow();
    w.minimize();
  }

  maximizeWindow() {
    if (!this.isElectron()) return;
    var w = Globals.window.electron.remote.getCurrentWindow();
    if (!w.isFullScreen()) {
      w.setFullScreen(true);
    } else {
      w.setFullScreen(false);
    }
  }

  isFullScreen() {
    if (!this.isElectron()) return;
    var w = Globals.window.electron.remote.getCurrentWindow();
    return w.isFullScreen();
  }

  setBadge(value) {
    if (!this.isElectron()) return;
    if (
      Globals.window.electron &&
      Globals.window.electron.remote &&
      Globals.window.electron.remote.app &&
      Globals.window.electron.remote.app.dock
    ) {
      Globals.window.electron.remote.app.dock.setBadge(value);
    }
  }
}

const instanceElectron = new Electron();
export default instanceElectron;
