import Observable from 'services/observable.js';
import ws from 'services/websocket.js';
import User from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Context from 'apps/context.js';

import Globals from 'services/Globals.js';

class SharingView extends Observable {
  constructor() {
    super();
    this.observableName = 'sharingViewService';
    this.userOn = {};

    Globals.window.sharingView = this;
  }

  addToUserOn(userId, url) {
    var user = undefined;
    if (userId !== undefined) {
      if (userId == Context.getUser().id) {
        user = Context.getUser();
      } else {
        user = Workspaces.getUserById(userId);
      }
    }
    if (this.userOn[url] === undefined) {
      this.userOn[url] = [];
    }
    var index = this.userOn[url].indexOf(user);
    if (index == -1 && user !== undefined) {
      this.userOn[url].push(user);
    }
  }

  subscribeTo(id) {
    var that = this;
    if (this.userOn[id] === undefined) {
      this.userOn[id] = [];
    }
    ws.subscribe('sharing_view/' + id, function(res, b) {
      if (that.userOn[id] !== undefined) {
        if (b.userJoin !== undefined) {
          ws.publish('sharing_view/' + id, { userIsHere: User.user.id });
          that.addToUserOn(b.userJoin, id);
        }
        if (b.userLeave !== undefined) {
          var index = -1;
          that.userOn[id].forEach((e, i) => {
            if (e.id == b.userLeave) {
              index = i;
            }
          });
          if (index > -1) {
            that.userOn[id].splice(index, 1);
          }
          if (b.userLeave == User.user.id) {
            ws.publish('sharing_view/' + id, { userJoin: User.user.id });
          }
        }
        if (b.userIsHere !== undefined) {
          that.addToUserOn(b.userIsHere, id);
        }
      }
      that.notify();
    });
    ws.publish('sharing_view/' + id, { userJoin: User.user.id });
  }

  unsubscribeTo(id) {
    ws.publish('sharing_view/' + id, { userLeave: User.user.id });
    ws.unsubscribe('sharing_view/' + id);
    if (this.userOn[id] !== undefined) {
      this.userOn[id] = undefined;
    }
    this.notify();
  }
}

const sharingView = new SharingView();
export default sharingView;
