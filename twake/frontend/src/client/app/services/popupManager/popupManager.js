import Observable from 'services/observable.js';
import MenusManager from 'services/Menus/MenusManager.js';
import WindowService from 'services/utils/window.js';
import ChannelsService from 'services/channels/channels.js';

import Globals from 'services/Globals.js';

class PopupService extends Observable {
  constructor() {
    super();
    console.log('PopupService constructor !');
    this.setObservableName('popupService');
    Globals.window.popupService = this;
    this.component = []; // element as {component,canClose}
    this.popupStates = {};
  }
  open(component, canClose, clearState) {
    WindowService.setTitle();
    MenusManager.closeMenu();
    if (clearState) {
      delete this.popupStates[clearState];
    }
    this.component.push({ component: component, canClose: canClose !== false });
    console.log('did open and will notify');
    this.notify();
  }
  isOpen() {
    return this.component.length > 0;
  }
  close() {
    if (this.isOpen()) {
      this.component.splice(-1, 1);
      this.notify();
    }
    if (this.component.length == 0) {
      ChannelsService.updateTitle();
    }
  }
  closeAll() {
    if (this.isOpen()) {
      this.component = [];
      this.notify();
    }
  }
  canClose() {
    if (this.isOpen()) {
      return this.component[this.component.length - 1].canClose;
    }
    return null;
  }
  getComponent() {
    if (this.isOpen()) {
      return this.component[this.component.length - 1].component;
    }
    return null;
  }
}

Globals.services.popupService = Globals.services.popupService || new PopupService();
export default Globals.services.popupService;
