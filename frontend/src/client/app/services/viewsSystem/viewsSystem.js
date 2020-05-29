import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import applicationBridge from 'services/applications/applicationBridge';

import Globals from 'services/Globals.js';

class ViewsSystem extends Observable {
  constructor() {
    super();
    this.setObservableName('viewsSystem');

    Globals.window.viewsSystemService = this;

    this.views = [];
  }

  init(views, options) {
    this.views = views;
    this.view = this.views[0];
    this.notify();
  }

  changeTitle(position, title) {
    this.views.forEach(item => {
      if (item.id == position) {
        item.title = title;
      }
    });
    this.notify();
  }

  changeActions(position, actions) {
    this.views.forEach(item => {
      if (item.id == position) {
        item.header_actions = actions;
      }
    });
    this.notify();
  }

  goBack() {
    if (this.view.id == 0 && Globals.window.Twake) {
      Globals.window.Twake.call('/core/openleftbar');
    }
    this.view = this.views[Math.max(0, this.view.id - 1)];
    this.notify();

    document.activeElement.blur();
  }

  open(position) {
    var position = position || Math.max(0, this.view.id + 1);
    if (!this.views[position]) {
      return;
    }
    this.view = this.views[position];
    this.notify();

    document.activeElement.blur();
  }
}

const viewsSystem = new ViewsSystem();
export default viewsSystem;
