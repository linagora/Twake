import Globals from 'services/Globals';

class Electron {
  constructor() {}

  isElectron() {
    return window.electron !== undefined;
  }

  setBadge(value) {
    if (!this.isElectron()) return;
    try {
      if (
        window.electron &&
        window.electron.remote &&
        window.electron.remote.app &&
        window.electron.remote.app.dock
      ) {
        window.electron.remote.app.dock.setBadge(value);
      }
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('application:update_badge', value);
      }
    } catch (err) {
      console.log('No electron app available for setting dock badge');
    }
  }
}

const instanceElectron = new Electron();
export default instanceElectron;
