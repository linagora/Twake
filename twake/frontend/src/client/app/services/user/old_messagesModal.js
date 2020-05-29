import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import Login from 'services/login/login.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Notifications from 'services/user/notifications.js';
import Api from 'services/api.js';
import Websocket from 'services/websocket.js';
import UserMessages from 'services/user/user_messages.js';
import ReactNative from 'services/reactNative/reactNative.js';
import User from 'services/user/user.js';
import applicationBridge from 'services/applications/applicationBridge';
import Applications from 'services/applications/applications.js';
import Context from 'apps/context.js';

import Globals from 'services/Globals.js';

class MessagesModal extends Observable {
  constructor() {
    super();
    this.setObservableName('messagesModal');

    this.visible = false;
    this.stream_id = 0;
    this.subject_id = 0;

    this.conversationForUser = {};
    this.streamToUser = {};

    Globals.window.messagesModalService = this;
  }

  open(stream_id, subject_id, user_id) {
    if (this.visible) {
      this.visible = false;
      this.notify();
      setTimeout(() => {
        this.open(stream_id, subject_id, user_id);
      }, 500);
      return;
    }

    if (this.streamToUser[stream_id] == 'no_user') {
      //Not a private stream so continue
    } else {
      if (!this.streamToUser[stream_id]) {
        var that = this;
        Api.post(
          'discussion/getStream',
          {
            id: stream_id,
          },
          function(res) {
            if (res.data && res.data) {
              if (res.data.type != 'user') {
                that.streamToUser[stream_id] = 'no_user';
                that.open(stream_id, subject_id, undefined);
              } else {
                var members = res.data.members;
                user_id = members[0].id;
                if (user_id == Context.getUser().id) {
                  user_id = members[1].id;
                }
                that.conversationForUser[stream_id] = user_id;
                that.streamToUser[stream_id] = user_id;
                that.open(stream_id, subject_id, user_id);
              }
            }
          },
        );
        return;
      }
    }

    if (user_id) {
      //Test if user is in current workspace
      var found = false;
      Context.getWorkspace().members.forEach(user => {
        if (user.id == user_id) {
          found = true;
        }
      });
      if (found) {
        //Open message app
        var app = Applications.getAppByPublicKey('messages');
        Applications.newWindow(app, undefined, undefined, '&onopen_code=' + stream_id + '/0');
        applicationBridge.event(
          'onopen_code_change',
          { notifCode: stream_id + '/0' },
          app.id,
          Context.getWorkspace().id,
        );
        return;
      }
    }
    this.stream_id = stream_id;
    this.subject_id = subject_id || 0;
    this.visible = true;
    this.notify();
  }

  openUser(id) {
    if (id == User.user.id || this.loading) {
      return;
    }

    if (this.conversationForUser[id]) {
      this.open(this.conversationForUser[id], undefined, id);
    }
    this.loading = true;
    Api.post('discussion/streams/getForUser', { id: id }, res => {
      this.loading = false;
      if (res.data) {
        this.conversationForUser[id] = res.data.id;
        this.streamToUser[res.data.id] = id;
        this.open(this.conversationForUser[id], undefined, id);
      }
    });
  }

  close() {
    this.visible = false;
    this.notify();
  }
}

const messagesModal = new MessagesModal();
export default messagesModal;
