import Api from 'services/api.js';
import Observable from 'services/observable.js';
import ws from 'services/websocket.js';
import WindowState from 'services/utils/windowState.js';

import Globals from 'services/Globals.js';

class GoToNotifService extends Observable {
  constructor(props) {
    super();
    this.loading = true;
    this.callback = function() {};
    this.removeCallback = function() {};

    this.setObservableName('appGoToNotifService');
  }

  setCallback(callback) {
    this.callback = callback;
    var that = this;
    Globals.window.Twake.on('onopen_code_change', function(data) {
      that.goTo(data.notifCode);
    });
    this.testUrl();
  }

  testUrl() {
    var notifCode = WindowState.findGetParameter('onopen_code');
    if (notifCode != null) {
      this.goTo(notifCode);
    }
  }

  goTo(notifCode) {
    this.callback(notifCode);
    this.removeNotif();
  }

  setRemoveNotifValues(application_id, workspace_id) {
    this.application_id = application_id;
    this.workspace_id = workspace_id;
  }

  removeNotif() {
    if (this.application_id !== undefined) {
      var data = { application: this.application_id, workspace_id: this.workspace_id };

      Api.post('notifications/delete', data, function(data) {});
    }
  }
}

const goToNotifService = new GoToNotifService();
export default goToNotifService;
