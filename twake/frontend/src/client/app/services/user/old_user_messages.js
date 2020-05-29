import React from 'react';
import Observable from 'services/observable.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import User from 'services/user/user.js';

import Globals from 'services/Globals.js';

class UserMessages extends Observable {
  constructor() {
    super();
    this.setObservableName('user_messages');

    this.messages = [];
  }

  get() {
    var that = this;
    Api.post('discussion/getLastMessages', {}, function(data) {
      that.messages = data.data;
      that.notify();
    });
  }
}

const userMessages = new UserMessages();
export default userMessages;
