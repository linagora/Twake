import Number from 'services/utils/Numbers.js';
import api from 'services/api.js';
import Observable from 'services/observable.js';
import SocketCluster from 'services/socketcluster/socketcluster.js';
import CryptoJS from 'crypto-js';
import Collections from 'services/Collections/Collections';
import LoginService from 'services/login/login';

import Globals from 'services/Globals.js';

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

    Globals.window.websocketsManager = this;
    this.autobahn = SocketCluster;

    var updateOnlineStatus = () => {
      if (navigator.onLine) {
        if (!this.connected) {
          this.reconnect();
        }
      } else {
        this.connectionError('offline', 'navigator is offline');
      }
    };
    updateOnlineStatus = updateOnlineStatus.bind(this);

    Globals.window.addEventListener('online', updateOnlineStatus);
    Globals.window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    var that = this;

    this.window_focus = true;
    this.window_last_blur = new Date();
    this.deconnectionBlurTimeout = setTimeout(() => {}, 0);
    Globals.window.addEventListener(
      'focus',
      (() => {
        this.reconnectIfNeeded(120);
        clearTimeout(this.deconnectionBlurTimeout);
        this.didFocusedLastMinute = true;
        this.window_focus = true;
        this.window_last_blur = new Date();
        if (this.ws == null || new Date().getTime() - this.window_last_blur.getTime() > 30000) {
          this.alive_connected = false;
          this.alive();
        }
      }).bind(this),
    );
    Globals.window.addEventListener(
      'blur',
      (() => {
        this.window_focus = false;
        this.window_last_blur = new Date();
      }).bind(this),
    );

    this.alive.bind(this);
  }

  //DISABLED
  hostReachable() {
    // Handle IE and more capable browsers
    var xhr = new (Globals.window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
    var status;

    // Open new request as a HEAD to the root hostname with a random param to bust the cache
    xhr.open(
      'HEAD',
      Globals.window.api_root_url + '/ajax/?rand=' + Math.floor((1 + Math.random()) * 0x10000),
      false,
    );

    // Issue request and handle response
    try {
      xhr.send();
      return xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304);
    } catch (error) {
      return false;
    }
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
      api.post(
        'users/alive',
        { focus: this.didFocusedLastMinute },
        () => {
          this.reconnectIfNeeded();
          clearTimeout(this.alive_timeout);
          if (!this.alive_connected) {
            this.reconnect();
          }
          this.alive_connected = true;
        },
        false,
        5000,
      );
      this.didFocusedLastMinute = Globals.isReactNative || Globals.window.document.hasFocus();
    }
  }

  reconnectIfNeeded(seconds = 60) {
    if (new Date().getTime() - this.last_reconnect_call_if_needed.getTime() > seconds * 1000) {
      //30 seconds
      if (LoginService.currentUserId) {
        Collections.get('channels').reload();
        LoginService.updateUser();

        console.log(
          'Refresh notifications',
          new Date().getTime() - this.last_reconnect_call_if_needed.getTime(),
        );
      }

      if (
        new Date().getTime() - this.last_reconnect_call_if_needed.getTime() >
        seconds * 1000 * 30
      ) {
        this.reconnect();
      }
      this.last_reconnect_call_if_needed = new Date();
    }
  }

  useOldMode(bool) {
    this.autobahn = SocketCluster;
    this.use_old_mode = bool;
  }

  setPublicKey(pk) {
    this.public_key = pk;
  }

  //Receive server message
  message(unid, route, data) {
    if (this.public_key && !data.encrypted) {
      //TODO verify signed messages incomming from server (push)
      //Before that we have to remove non secure exchanged messages between users (non pushed)
    }
    if (unid != this.subscribedKey[route]) {
      return;
    }
    this.alive();
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
    if (!key) {
      key = callback.name;
    }
    if (!this.subscribed[route]) {
      this.subscribed[route] = [];
    }
    this.subscribed[route].push({ name: key, callback: callback });
    if (this.subscribed[route].length == 1) {
      try {
        this.ws.unsubscribe(route);
      } catch (err) {}
      try {
        var unid = Number.unid();
        this.subscribedKey[route] = unid;
        this.ws.subscribe(route, (a, b) => {
          this.message(unid, a, b);
        });
      } catch (err) {
        this.reconnect();
      }
    }
  }

  //Unsubscribe from channel
  unsubscribe(route, callback, key) {
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
      if (c.name != key) {
        remaining.push(c);
      }
    });
    this.subscribed[route] = remaining;
    if (this.subscribed[route].length == 0) {
      try {
        this.subscribedKey[route] = null;
        this.ws.unsubscribe(route);
      } catch (err) {}
    }
  }

  publish(route, value) {
    this.startHeartBeat();
    if (this.ws) {
      try {
        this.ws.publish(route, value);
      } catch (err) {
        this.reconnect();
      }
    }
  }

  connect() {
    this.reconnect();
  }

  reconnect() {
    if (this.is_reconnecting) {
      return;
    }
    this.is_reconnecting = true;
    this.notify();

    api.post(
      'users/alive',
      { focus: this.didFocusedLastMinute },
      res => {
        if (res._request_failed) {
          setTimeout(() => {
            this.is_reconnecting = false;
            this.notify();
            this.reconnect();
          }, 2000);
        } else {
          var that = this;
          var onopen = function (session) {
            that.is_reconnecting = false;

            that.disconnect();

            that.updateConnected(true);

            that.testNetwork = false;

            if (that.firstTime) {
              that.firstTime = false;
            } else {
              if (new Date().getTime() - that.last_reconnect_call.getTime() > 10000) {
                that.last_reconnect_call = new Date();

                var key = Object.keys(that.disconnectListeners);
                key.forEach(k => {
                  try {
                    that.disconnectListeners[k]();
                  } catch (err) {}
                });
              }
            }

            that.ws = session;
            that.startHeartBeat();

            var routes = Object.keys(that.subscribed);
            routes.forEach(route => {
              if (that.subscribed[route] && that.subscribed[route].length > 0) {
                try {
                  this.ws.unsubscribe(route);
                } catch (err) {}
                var unid = Number.unid();
                that.subscribedKey[route] = unid;
                that.ws.subscribe(route, function (a, b) {
                  that.message(unid, a, b);
                });
              }
            });
          };

          try {
            var connection = null;

            var suffix = '';
            if (this.use_old_mode) {
              suffix = '/ws/';
            }

            var method = '?';
            var route = Globals.window.websocket_url || '';

            if (route.split('://').length > 1) {
              method = route.split('://')[0];
              route = route.split('://')[1];
            }

            if (
              Globals.window.api_root_url.indexOf('https:') == 0 ||
              Globals.window.standalone ||
              Globals.window.reactNative ||
              method == 'wss'
            ) {
              connection = that.autobahn.connect('wss://' + route + suffix);
            } else {
              connection = that.autobahn.connect('ws://' + route + suffix);
            }

            connection.on('socket/connect', function (session) {
              that.is_reconnecting = false;
              onopen(session);
            });
            connection.on('socket/disconnect', function (error) {
              console.log(error);
              that.connectionError(error.reason, error.code);
              that.is_reconnecting = false;
              that.notify();
            });
          } catch (err) {
            that.connectionError('autobahn.connect', err);
            that.is_reconnecting = false;
          }
        }
      },
      false,
      5000,
    );
  }

  disconnect() {
    if (this.ws) {
      try {
        this.updateConnected(false);
        this.ws.close();
      } catch (err) {
        console.log(err);
      }
      this.ws = null;
    }
  }

  connectionError(reason, details) {
    if (details == 0) {
      this.updateConnected(false);
      console.log('Network : Connexion closed', reason, details);
      return;
    }

    this.updateConnected(false);

    if (this.connectionTest) {
      clearTimeout(this.connectionTest);
    }
    this.connectionTest = setTimeout(() => {
      this.reconnect();
    }, 5000);
  }

  startHeartBeat() {
    if (
      !this.lastHeartBeat ||
      !this.nextHeartBeatDelay ||
      new Date().getTime() - this.lastHeartBeat.getTime() > this.nextHeartBeatDelay
    ) {
      this.lastHeartBeat = new Date();
      this.nextHeartBeatDelay = Math.random() * 120 * 1000 + 5000; //navigator.offline not reliable

      /*if(!navigator.onLine && this.lastData>0 && (new Date()).getTime() - this.lastData > 2000){
				this.lastData = (new Date()).getTime();
				that.connectionError("offline", "navigator is offline in heartbeat");
			}else*/ if (
        this.window_focus &&
        !this.testNetwork &&
        this.lastData > 0 &&
        new Date().getTime() - this.lastData > 2000
      ) {
        this.lastData = new Date().getTime();
        this.testNetwork = true;
        //Proceed to test
        try {
          if (this.ws) {
            this.ws.call('ping/ping', {}).then(
              result => {
                this.updateConnected(true);
                this.testNetwork = false;
              },
              (error, desc) => {
                this.connectionError('no ping', '');
                this.testNetwork = false;
              },
            );
          }
        } catch (err) {
          console.log('Unable to call on ws', err);
        }
      }
    }

    if (this.heartBeatInterval) {
      clearTimeout(this.heartBeatInterval);
    }
    this.heartBeatInterval = setTimeout(() => {
      this.startHeartBeat();
    }, 5000);
  }

  onReconnect(id, callback) {
    this.disconnectListeners[id] = callback;
  }

  offReconnect(id) {
    delete this.disconnectListeners[id];
  }

  getSubscribeCount(route) {
    return this.subscribed[route] ? this.subscribed[route].length : 0;
  }

  updateConnected(state) {
    if (state != this.connected) {
      this.connected = state;
      this.notify();
    }
    console.log('CONNECTED_STATE = ', state);
  }

  isConnected() {
    return this.connected;
  }
}

var ws = new Websocket();
export default ws;
