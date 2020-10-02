import React, { Component } from 'react';

import Observable from 'services/observable.js';
import Confirm from 'components/Alert/Confirm.js';
import Alert from 'components/Alert/Alert.js';

import Globals from 'services/Globals.js';

class AlertService extends Observable {
  constructor() {
    super();
    this.setObservableName('alertService');
    Globals.window.alertService = this;
    this.component = []; // element as {component,onConfirm,onClose}

    this.alertComponent = '';
    this.confirmComponent = '';
  }

  open(component, onConfirm, onClose) {
    this.component.push({ component: component, onConfirm: onConfirm, onClose: onClose });
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
  }
  confirmAlert() {
    if (this.isOpen()) {
      if (this.component[this.component.length - 1].onConfirm) {
        try {
          this.component[this.component.length - 1].onConfirm();
        } catch (e) {
          console.log(e);
        }
      }
      this.close();
    }
  }
  closeAlert() {
    if (this.isOpen()) {
      if (this.component[this.component.length - 1].onClose) {
        try {
          this.component[this.component.length - 1].onClose();
        } catch (e) {
          console.log(e);
        }
      }
      this.close();
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
  alert(onClose, options) {
    options = options || {};
    var onCloseFunction = onClose
      ? () => {
          onClose();
        }
      : null;
    this.open(
      <Alert title={options.title} text={options.text} />,
      onCloseFunction,
      onCloseFunction,
    );
  }
  confirm(onConfirm, onClose = undefined, options = undefined) {
    options = options || {};
    var onConfirmFunction = onConfirm
      ? () => {
          onConfirm();
        }
      : null;
    var onCloseFunction = onClose
      ? () => {
          onClose();
        }
      : null;
    this.open(
      <Confirm title={options.title} text={options.text} />,
      onConfirmFunction,
      onCloseFunction,
    );
  }
}

const alert_serv = new AlertService();
export default alert_serv;
