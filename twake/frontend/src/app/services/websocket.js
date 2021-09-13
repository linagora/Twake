import Number from 'services/utils/Numbers.js';
import Api from 'services/Api';
import Observable from 'app/services/Depreciated/observable.js';
import Collections from 'services/Collections/Collections';
import LoginService from 'services/login/login';

import Globals from 'services/Globals';

class Websocket extends Observable {
  constructor() {
    super();
    this.setObservableName('websockets');

    this.ws = null;
    this.connection = null;
    this.afterError = false;
    this.lastData = 1;
    this.testNetwork = false;

    this.connected = true;
    this.subscribed = {};
    this.subscribedKey = {};
    this.disconnectListeners = {};

    this.alive_connected = true;

    this.firstTime = true;
    this.last_reconnect_call = new Date();
    this.last_reconnect_call_if_needed = new Date();

    window.websocketsManager = this;

    this.window_focus = true;
    this.window_last_blur = new Date();
    this.deconnectionBlurTimeout = setTimeout(() => {}, 0);
    Globals.window.addEventListener('focus', () => {
      this.reconnectIfNeeded(60);
      clearTimeout(this.deconnectionBlurTimeout);
      this.didFocusedLastMinute = true;
      this.window_focus = true;
      this.window_last_blur = new Date();
      if (this.ws == null || new Date().getTime() - this.window_last_blur.getTime() > 30000) {
        this.alive_connected = false;
        this.alive();
      }
    });
    Globals.window.addEventListener('blur', () => {
      this.window_focus = false;
      this.window_last_blur = new Date();
    });

    this.alive.bind(this);
    this.message.bind(this);
    this.updateConnected.bind(this);
  }

  //Send I'm alive !
  alive() {
    var nw = new Date().getTime();
    if (!this.lastAlive || nw - this.lastAlive > 60000) {
      // Wait at least 60 seconds
      this.lastAlive = nw;
      this.alive_timeout = setTimeout(() => {
        this.alive_connected = false;
      }, 5100);
      Api.post(
        '/users/alive',
        { focus: this.didFocusedLastMinute },
        () => {
          this.reconnectIfNeeded();
          clearTimeout(this.alive_timeout);
          this.alive_connected = true;
        },
        false,
      );
      this.didFocusedLastMinute = Globals.isReactNative || Globals.window.document.hasFocus();
    }
  }

  //Receive server message
  message(unid, route, data) {
    route = (route || '').split('previous::').pop();
    if (unid !== this.subscribedKey[route]) {
      return;
    }
    if (this.subscribed[route]) {
      this.subscribed[route].forEach(c => {
        try {
          c.callback(route, data);
        } catch (err) {
          console.log(err);
        }
      });
    } else {
      this.unsubscribe(route);
    }
  }

  //Subscribe to channel
  subscribe(route, callback, key) {
    route = (route || '').split('previous::').pop();
    if (!key) {
      key = callback.name;
    }
    if (!this.subscribed[route]) {
      this.subscribed[route] = [];
    }
    this.subscribed[route].push({ name: key, callback: callback });
    if (this.subscribed[route].length === 1) {
      const unid = Number.unid();
      this.subscribedKey[route] = unid;
      Collections.getTransport()
        .getSocket()
        .join('previous::' + route, '', (type, data) => {
          if (type === 'realtime:event') {
            this.message(unid, data.name, data.data);
          }
          if (type === 'connected') {
            this.updateConnected(true);
          }
          if (type === 'disconnected') {
            this.updateConnected(false);
          }
        });
    }
  }

  //Unsubscribe from channel
  unsubscribe(route, callback, key) {
    route = (route || '').split('previous::').pop();
    if (!key && callback) {
      key = callback.name;
    }
    if (!key) {
      key = 'default';
    }
    if (!this.subscribed[route]) {
      this.subscribed[route] = [];
    }
    var remaining = [];
    this.subscribed[route].forEach(c => {
      if (c.name !== key) {
        remaining.push(c);
      }
    });
    this.subscribed[route] = remaining;
    if (this.subscribed[route].length === 0) {
      Collections.getTransport()
        .getSocket()
        .leave('previous::' + route, '');
    }
  }

  publish(route, value) {
    Collections.getTransport()
      .getSocket()
      .emit('previous::' + route, value);
  }

  reconnectIfNeeded(seconds = 30) {
    if (new Date().getTime() - this.last_reconnect_call_if_needed.getTime() > seconds * 1000) {
      //30 seconds
      if (LoginService.currentUserId) {
        LoginService.updateUser();
      }

      this.last_reconnect_call_if_needed = new Date();
    }
  }

  onReconnect(id, callback) {
    this.disconnectListeners[id] = callback;
  }

  offReconnect(id) {
    delete this.disconnectListeners[id];
  }

  updateConnected(state) {
    if (state !== this.connected) {
      this.connected = state;
      this.notify();
    }
  }

  isConnected() {
    return this.connected;
  }
}

var ws = new Websocket();
export default ws;
