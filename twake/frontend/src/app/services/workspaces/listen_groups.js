import React from 'react';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';

class ListenGroups {
  constructor() {
    this.groups_repository = Collections.get('groups');
    this.listenerCount = {};
  }

  listenGroup(idGroup) {
    if (!idGroup) {
      return;
    }

    if (!this.listenerCount[idGroup]) {
      this.listenerCount[idGroup] = 0;
    }
    this.listenerCount[idGroup] += 1;

    var that = this;
    if (this.listenerCount[idGroup] == 1) {
<<<<<<< HEAD
      ws.subscribe('group/' + idGroup, function (uri, data) {
=======
      ws.subscribe('group/' + idGroup, function(uri, data) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        data = data.data;
        if (data.group) {
          data.group.id = idGroup;
          that.groups_repository.updateObject(data.group);
          console.log(that.groups_repository);
          console.log(that.groups_repository.find(data.group.id));
        }
      });
    }
  }

  cancelListenGroup(idGroup) {
    if (!idGroup) {
      return;
    }

    if (this.listenerCount[idGroup]) {
      this.listenerCount[idGroup] += -1;
    }
    if (!this.listenerCount[idGroup] || this.listenerCount[idGroup] == 0) {
      ws.unsubscribe('group/' + idGroup);
    }
  }
}

const service = new ListenGroups();
export default service;
