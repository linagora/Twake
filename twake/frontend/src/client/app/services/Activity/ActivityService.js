import Api from 'services/api.js';
import Observable from 'services/observable.js';
import ws from 'services/websocket.js';

import Globals from 'services/Globals.js';

class ActivityService extends Observable {
  constructor() {
    super();
    this.loading = true;
    this._activity = [];
    this.activity = [];
    this.totalNotifications = 0;
    this.setObservableName('appActivityService');

    this.refreshNotificationsTimeout = setTimeout(() => {}, 0);
    document.addEventListener('click', () => {
      if (this.refreshNotificationsLocked) {
        return;
      }
      this.refreshNotificationsLocked = true;

      this.updateFromParent();

      clearTimeout(this.refreshNotificationsTimeout);
      this.refreshNotificationsTimeout = setTimeout(() => {
        this.refreshNotificationsLocked = false;
      }, 5000);
    });

    this.updateFromParent();
  }

  updateFromParent() {
    Twake.call('/core/get_notifications', {}, notifications => {
      if (notifications != this.totalNotifications) {
        this.totalNotifications = notifications;
        this.notify();
      }
    });
  }

  init(code, workspaceId) {
    var that = this;
    Api.post('notifications/init', {}, function(data) {
      that.totalNotifications = 0;
      for (var i = 0; i < data.data.length; i++) {
        if (data.data[i].code == code && data.data[i].workspace_id == workspaceId)
          that.totalNotifications++;
      }
      that.notify();
    });
  }

  removeBadge(application_id, workspace_id) {
    var that = this;
    var data = { application: application_id, workspace_id: workspace_id };

    Api.post('notifications/delete', data, function(data) {
      that.totalNotifications = 0;
      that.notify();
    });
  }

  subscribe(ws_route, url, workspaceId, offset) {
    var that = this;
    ws.subscribe(ws_route, function(uri, data) {
      that.totalNotifications += 1;
      that.activity.unshift(data);
      that.notify();
    });
  }

  unsubscribe(ws_route) {
    ws.unsubscribe(ws_route);
  }

  getAppActivity(url, workspaceId, offset) {
    var data = {};
    data.limit = 30;
    data.workspaceId = workspaceId;
    var that = this;

    this.loading = true;
    this.notify();

    offset != null ? (data.offset = offset) : (data.offset = 0);
    if (url && workspaceId) {
      Api.post(url, data, function(res) {
        that._activity = res.data;
        that.activity = that.activity.concat(that._activity);
        that.loading = false;
        that.notify();
      });
    } else {
      return null;
    }
  }

  readAllActivity(url, workspaceId) {
    var data = {};
    data.workspaceId = workspaceId;

    if (url && workspaceId) {
      Api.post(url, data, function(res) {});
    } else {
      return null;
    }
  }

  readOnlyOneActivity(url, workspaceId, idActivity) {
    var data = {};
    data.activityId = idActivity;
    data.workspaceId = workspaceId;
    if (url && idActivity && workspaceId) {
      Api.post(url, data, function(res) {});
    } else {
      return null;
    }
  }
}

const activityService = new ActivityService();
export default activityService;
