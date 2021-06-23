import Observable from 'app/services/Depreciated/observable.js';

import Globals from 'services/Globals';

class ConfiguratorsManager extends Observable {
  constructor() {
    super();
    this.setObservableName('configurators_manager');
    Globals.window.configuratorsManager = this;

    this.currentConfigurators = {};
    this.configurator_order = [];
  }

  openConfigurator(app, form, hidden_data) {
    this.currentConfigurators[app.id] = {
      app: app,
      form: form,
      hidden_data: hidden_data,
    };

    var _new_order = [];
    this.configurator_order.forEach(id => {
      if (app.id != id) {
        _new_order.push(id);
      }
    });
    _new_order.push(app.id);
    this.configurator_order = _new_order;

    this.notify();
  }

  closeConfigurator(app) {
    delete this.currentConfigurators[app.id];

    var _new_order = [];
    this.configurator_order.forEach(id => {
      if (app.id != id) {
        _new_order.push(id);
      }
    });
    this.configurator_order = _new_order;
    this.notify();
  }
}

const conf_serv = new ConfiguratorsManager();
export default conf_serv;
