<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Observable from 'services/observable.js';

/*
  Menus manager service, choose where to generate menu
*/
class AttributesManager extends Observable {
  constructor() {
    super();
    this.setObservableName('parameters_attributes');

    this.open = '';
  }
  toggle(id) {
    if (this.open == id) {
      this.open = '';
    } else {
      this.open = id;
    }
    this.notify();
  }
}

const service = new AttributesManager();
export default service;
