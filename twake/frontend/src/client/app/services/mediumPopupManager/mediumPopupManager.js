import Observable from 'services/observable.js';
import MenusManager from 'services/Menus/MenusManager.js';

import Globals from 'services/Globals.js';

class MediumPopupManager extends Observable {
  constructor() {
    super();
    this.setObservableName('mediumPopupService');
    Globals.window.mediumPopupService = this;
    this.component = []; // element as {component,canClose}
    this.popupStates = {};
    this.position = null;
    this.mountedComponent = null;
  }
  updateHighlight(highlight) {
    this.position.highlight = highlight;
    this.notify();
  }
  open(component, position, canClose, clearState) {
    this.close();

    this.mountedComponent = null;

    this.creationTimeout && clearTimeout(this.creationTimeout);
    this.creationTimeout = setTimeout(() => {
      this.component = [];
      this.position = position || {};
      MenusManager.closeMenu();
      if (clearState) {
        delete this.popupStates[clearState];
      }
      this.component.push({ component: component, canClose: canClose !== false });
      this.notify();
    }, 100);
  }
  isOpen() {
    return this.component.length > 0;
  }
  close() {
    if (this.closing) {
      return false;
    }
    if (this.isOpen()) {
      this.closing = true;
      (this.mountedComponent || {}).onMediumPopupClose &&
        this.mountedComponent.onMediumPopupClose();

      this.mountedComponent = null;
      this.component.splice(-1, 1);
      this.notify();
      this.closing = false;
    }
  }
  closeAll() {
    if (this.isOpen()) {
      (this.mountedComponent || {}).onMediumPopupClose &&
        this.mountedComponent.onMediumPopupClose();

      this.mountedComponent = null;
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

Globals.services.mediumPopupService =
  Globals.services.mediumPopupService || new MediumPopupManager();
export default Globals.services.mediumPopupService;
