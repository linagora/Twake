import React from 'react';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import UserService from './user.js';

import Globals from 'services/Globals.js';

class ListenUsers {
  constructor() {
    this.users_repository = Collections.get('users');
    this.listenerCount = {};

    Globals.window.listenUsers = this;

    this.connectedPing = {};
    this.pingTimeouts = {};

    this.was_connected_last_check = {};

    this.lastPong = 0;
  }

  //Check if we are active: new Date().getTime() - ws.lastAlive < 1000*60*5

  ping(_idUser) {
    var idUser = _idUser;
    ws.publish('users/' + idUser, {
      ping: true,
      user: { connected: true, id: UserService.getCurrentUserId() },
    });
    if (this.pingTimeouts[idUser]) clearTimeout(this.pingTimeouts[idUser]);
    this.pingTimeouts[idUser] = setTimeout(() => {
      //Only say this to me !
      var user = Collections.get('users').find(idUser);
      if (user) {
        if (user.connected) {
          user.connected = false;
          this.users_repository.updateObject(user);
        }
      }
      this.was_connected_last_check[idUser] = false;
    }, 5000);
  }

  pong() {
    this.lastPong = new Date().getTime();
    ws.publish('users/' + UserService.getCurrentUserId(), {
      user: { connected: true, id: UserService.getCurrentUserId() },
    });
  }

  listenUser(idUser) {
    if (!idUser) {
      return;
    }

    if (!this.listenerCount[idUser]) {
      this.listenerCount[idUser] = 0;
    }
    this.listenerCount[idUser] += 1;

    var that = this;
    if (this.listenerCount[idUser] == 1) {
      ws.subscribe('users/' + idUser, function (uri, data) {
        /*if (idUser == UserService.getCurrentUserId()) {
          if (data.ping) {
            that.pong();
          }
        }*/
        if (data.user && data.user.id) {
          /*that.setUserPingTimeout(data.user.id);
          if (data.user.connected && that.pingTimeouts[idUser]) {
            clearTimeout(that.pingTimeouts[idUser]);
          }*/
          if (that.users_repository.find(data.user.id)) {
            that.was_connected_last_check[idUser] = data.user.connected;
            if (
              data.user.username ||
              data.user.notifications_preferences ||
              data.user.connected != that.users_repository.find(data.user.id).connected
            ) {
              that.users_repository.updateObject(data.user);
            }
          } else if (data.user.id) {
            UserService.asyncGet(data.user.id);
          }
        }
      });

      if (idUser != UserService.getCurrentUserId()) {
        /*setTimeout(() => {
          if (idUser != UserService.getCurrentUserId()) {
            this.setUserPingTimeout(idUser);
            this.ping(idUser);
          }
        }, 1000);

        if (new Date().getTime() - this.lastPong > 60000) {
          this.pong();
        }*/
      }
    }
  }

  setUserPingTimeout(idUser) {
    if (this.connectedPing[idUser]) clearTimeout(this.connectedPing[idUser]);
    this.connectedPing[idUser] = setTimeout(() => {
      this.ping(idUser);
      this.setUserPingTimeout(idUser);
    }, 600000);
  }

  cancelListenUser(idUser) {
    if (!idUser) {
      return;
    }

    if (this.listenerCount[idUser]) {
      this.listenerCount[idUser] += -1;
    }
    if (!this.listenerCount[idUser] || this.listenerCount[idUser] == 0) {
      ws.unsubscribe('users/' + idUser);
      if (this.connectedPing[idUser]) clearInterval(this.connectedPing[idUser]);
    }
  }
}

Globals.services.listenUserService = Globals.services.listenUserService || new ListenUsers();
export default Globals.services.listenUserService;
