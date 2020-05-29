import React from 'react';
import Observable from 'services/observable.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';
import WorkspacesService from 'services/workspaces/workspaces.js';
import ChannelsService from 'services/channels/channels.js';
import ElectronService from 'services/electron/electron.js';
import emojione from 'emojione';
import popupManager from 'services/popupManager/popupManager.js';
import windowState from 'services/utils/window.js';

import Globals from 'services/Globals.js';

class Notifications extends Observable {
  constructor() {
    super();
    this.setObservableName('notifications');
    Globals.window.notificationService = this;
    this.notifications_collection_key = 'notifications';

    this.newNotificationAudio = new Globals.Audio('./public/sounds/newnotification.wav');

    this.notification_by_group = {};
    this.notification_by_workspace = {};
    this.notification_by_channel = {};
    this.misc_notification_user = {};
    this._last_modified = {};

    this.doing_action = {};
    this.timeouts = {};
    this.marked_as_unread = {};

    Collections.get('notifications').addListener(this);
  }

  setState() {
    var length = Object.keys(Collections.get('notifications').known_objects_by_front_id).length;
    if (!this.last_notifications_length || length > this.last_notifications_length) {
      var last = Collections.get('notifications')
        .findBy({})
        .sort((a, b) => b.date - a.date)[0];
    }
    if (
      last &&
      (!this.last_notifications_date || last.date >= this.last_notifications_date) &&
      new Date().getTime() / 1000 - last.date < 10
    ) {
      this.last_notifications_date = last.date;
      this.receiveNewNotification(last);
    }
    this.last_notifications_length = length;
  }

  start() {
    if ('Notification' in window && Globals.window.Notification.requestPermission) {
      var request = Globals.window.Notification.requestPermission();
      if (request && request.then) {
        request.then(function(result) {});
      }
    }

    //This one receive notification content for push display
    Collections.get('notifications').addSource(
      {
        http_base_url: 'notifications',
        http_options: {},
        websockets: [
          { uri: 'notifications/' + User.getCurrentUserId(), options: { type: 'notifications' } },
        ],
      },
      this.notifications_collection_key,
    );

    //This one receive notification badge updates
    ws.subscribe('notifications/' + User.getCurrentUserId(), (uri, data) => {
      if (data.type == 'update') {
        if (data.notification.channel) {
          Collections.get('channels').updateObject(data.notification.channel);
        }

        if (data.notification.workspace_id) {
          this.updateBadge(
            'workspace',
            data.notification.workspace_id,
            data.notification.hasnotifications ? 1 : 0,
          );
        }

        if (data.notification.group_id) {
          this.updateBadge(
            'group',
            data.notification.group_id,
            data.notification.hasnotifications ? 1 : 0,
          );
        }
      }
    });
  }

  updateBadge(type, id, count, grey, circle) {
    if (isNaN(count)) {
      count = 0;
    }

    /**
     * We delay incresed count by 2 second, with this if the increse is cancelled it's invisible to the user
     */
    var delay = 2000;

    if (type == 'channel') {
      var old_count = (this.notification_by_channel[id] || {}).count;
      var channel = Collections.get('channels').findByFrontId(
        ChannelsService.currentChannelFrontId,
      ) || { id: ChannelsService.currentChannelFrontId };
      if (
        Globals.window.document.hasFocus() &&
        count > old_count &&
        id == channel.id &&
        !this.marked_as_unread[channel.id]
      ) {
        //We are in this channel so we read it
        this.read(channel, true);
        this.updateAppBadge();
      } else {
        delay = 10;
      }
    }

    var shouldNotify = true;

    if (type == 'group') {
      if (this.timeouts[type + '_' + id]) clearTimeout(this.timeouts[type + '_' + id]);
      this.timeouts[type + '_' + id] = setTimeout(
        () => {
          if ((this.notification_by_group[id] || {}).count == count) {
            shouldNotify = false;
          }
          this.notification_by_group[id] = {
            count: count,
            grey: false,
            circle: true,
          };
          this._last_modified['group_' + id] = new Date();
          this.updateAppBadge();
          this.checkWorkspaceAndGroupBadge();
          if (shouldNotify) this.notify();
        },
        count > (this.notification_by_group[id] || {}).count ? delay : 10,
      );
    }

    if (type == 'workspace') {
      if (this.timeouts[type + '_' + id]) clearTimeout(this.timeouts[type + '_' + id]);
      this.timeouts[type + '_' + id] = setTimeout(
        () => {
          if ((this.notification_by_workspace[id] || {}).count == count) {
            shouldNotify = false;
          }
          this.notification_by_workspace[id] = {
            count: count,
            grey: false,
            circle: true,
          };
          this._last_modified['workspace_' + id] = new Date();
          this.updateAppBadge();
          this.checkWorkspaceAndGroupBadge();
          if (shouldNotify) this.notify();
        },
        count > (this.notification_by_workspace[id] || {}).count ? delay : 10,
      );
    }

    if (type == 'channel') {
      if (this.timeouts[type + '_' + id]) clearTimeout(this.timeouts[type + '_' + id]);
      this.timeouts[type + '_' + id] = setTimeout(
        () => {
          if (
            (this.notification_by_channel[id] || {}).count == count &&
            (this.notification_by_channel[id] || {}).grey == grey &&
            (this.notification_by_channel[id] || {}).circle == circle
          ) {
            shouldNotify = false;
          }
          this.notification_by_channel[id] = {
            count: count,
            grey: grey,
            circle: circle,
          };
          this._last_modified['channel_' + id] = new Date();
          this.updateAppBadge();
          this.checkWorkspaceAndGroupBadge();
          if (shouldNotify) this.notify();
        },
        count > (this.notification_by_channel[id] || {}).count ? delay : 10,
      );
    }

    this.updateAppBadge();
  }

  checkWorkspaceAndGroupBadge() {
    var currentWorkspaceHasBadge = Collections.get('channels')
      .findBy({ original_workspace: WorkspacesService.currentWorkspaceId })
      .some(item => {
        return !!(this.notification_by_channel[item.id] || {}).count;
      });
    if (!currentWorkspaceHasBadge) {
      delete this.notification_by_workspace[WorkspacesService.currentWorkspaceId];
      this._last_modified['workspace_' + WorkspacesService.currentWorkspaceId] = new Date();
    }

    var currentGroupHasBadge = Collections.get('workspaces')
      .findBy({})
      .some(item => {
        return (
          !!(this.notification_by_workspace[item.id] || {}).count &&
          ((item || {}).group || {}).id == WorkspacesService.currentGroupId
        );
      });
    if (!currentGroupHasBadge) {
      delete this.notification_by_group[WorkspacesService.currentWorkspaceId];
      this._last_modified['group_' + WorkspacesService.currentWorkspaceId] = new Date();
    }
  }

  mute(channel, state) {
    var channel = channel.id || channel;

    var data = {
      channel_id: channel,
      mute: state,
    };

    if (this.doing_action['mute_' + channel]) {
      return;
    }
    this.doing_action['mute_' + channel] = true;

    Collections.get('channels').updateObject({ _user_muted: state, id: channel });

    Api.post('channels/mute', data, () => {
      this.doing_action['mute_' + channel] = false;
    });
  }

  readAll() {
    if (this.doing_action['read_all']) {
      return;
    }

    this.doing_action['read_all'] = true;
    Api.post('notifications/readAll', {}, () => {
      this.doing_action['read_all'] = false;
      Object.keys(Collections.get('channels').known_objects_by_id).forEach(id => {
        var channel = Collections.get('channels').find(id);
        Collections.get('channels').completeObject(
          { _user_last_message_increment: channel.messages_increment },
          channel.front_id,
        );
      });
      this.notification_by_channel = {};
      this.notification_by_group = {};
      this.notification_by_workspace = {};
      this.updateAppBadge();
      this.notify();
    });
  }

  read(channel, force) {
    var channel = channel.id || channel;

    if ((this.notification_by_channel[channel] || {}).count <= 0 && !force) {
      return;
    }

    var data = {
      channel_id: channel,
    };

    if (this.doing_action['read_' + channel]) {
      return;
    }
    this.doing_action['read_' + channel] = true;

    delete this.marked_as_unread[channel];

    Api.post('channels/read', data, () => {
      this.doing_action['read_' + channel] = false;
    });
  }

  unread(channel) {
    var channel = channel.id || channel;

    var data = {
      channel_id: channel,
    };

    if (this.doing_action['unread_' + channel]) {
      return;
    }
    this.doing_action['unread_' + channel] = true;

    this.marked_as_unread[channel] = true;

    Api.post('channels/unread', data, () => {
      this.doing_action['unread_' + channel] = false;
    });
  }

  receiveNewNotification(notification) {
    try {
      this.newNotificationAudio.play();
    } catch (e) {}

    var notification = notification;
    this.last_notification_callback = () => {
      popupManager.closeAll();
      if (notification.workspace_id) {
        WorkspacesService.select(Collections.get('workspaces').find(notification.workspace_id));
      }
      ChannelsService.select(Collections.get('channels').find(notification.channel_id));
    };
    this.last_notification = notification;
    this.notify();

    if ('Notification' in window && Globals.window.document.hasFocus) {
      if (
        Globals.window.Notification.permission === 'granted' &&
        !Globals.window.document.hasFocus()
      ) {
        var n = new Notification(emojione.shortnameToUnicode(notification.title), {
          body: emojione.shortnameToUnicode(notification.text),
        });
        var that = this;
        n.onclick = function() {
          that.last_notification_callback();
          Globals.window.focus();
          this.close();
        };
      }
    }
  }

  updateAppBadge() {
    var notifications = 0;
    Object.keys(this.notification_by_group).forEach(group_id => {
      notifications += (this.notification_by_group[group_id] || {}).count || 0;
    });
    if (notifications == 0) {
      Object.keys(this.notification_by_channel).forEach(chan_id => {
        notifications += (this.notification_by_channel[chan_id] || {}).count || 0;
      });
    }

    windowState.setNotificationsInTitle(notifications);

    if (Globals.PushNotification) {
      Globals.PushNotification.setApplicationIconBadgeNumber(notifications);
    }

    if (notifications > 0) {
      ElectronService.setBadge('' + notifications);
    } else {
      ElectronService.setBadge('');
    }
  }

  shouldNotify(node) {
    var update = true;
    if (
      node._observable &&
      node._observable[this.observableName] &&
      node._observable[this.observableName].listen_only
    ) {
      update = false;
      node._observable[this.observableName].listen_only.map(item => {
        if (
          !node._observable[this.observableName]._last_modified ||
          (this._last_modified[item] &&
            this._last_modified[item] > node._observable[this.observableName]._last_modified)
        ) {
          update = true;
          node._observable[this.observableName]._last_modified = new Date();
        }
      });
    }
    return update;
  }
}

Globals.services.notificationsService =
  Globals.services.notificationsService || new Notifications();
export default Globals.services.notificationsService;
