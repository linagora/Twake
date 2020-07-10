<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

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
        this.component[this.component.length - 1].onConfirm();
      }
      this.close();
    }
  }
  closeAlert() {
    if (this.isOpen()) {
      if (this.component[this.component.length - 1].onClose) {
        this.component[this.component.length - 1].onClose();
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
<<<<<<< HEAD
      onCloseFunction
=======
      onCloseFunction,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
  confirm(onConfirm, onClose, options) {
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
<<<<<<< HEAD
      onCloseFunction
=======
      onCloseFunction,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }
}

const alert_serv = new AlertService();
export default alert_serv;
