import React from 'react';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';

class ListenWorkspace {
  constructor() {
    this.workspaces_repository = Collections.get('workspaces');
    this.listenerCount = {};
  }

  listenWorkspace(idWorkspace) {
    if (!idWorkspace) {
      return;
    }

    if (!this.listenerCount[idWorkspace]) {
      this.listenerCount[idWorkspace] = 0;
    }
    this.listenerCount[idWorkspace] += 1;

    var that = this;
    if (this.listenerCount[idWorkspace] == 1) {
<<<<<<< HEAD
      ws.subscribe('workspace/' + idWorkspace, function (uri, data) {
=======
      ws.subscribe('workspace/' + idWorkspace, function(uri, data) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        if (data.workspace) {
          data.workspace.id = idWorkspace;
          that.workspaces_repository.updateObject(data.workspace);
        }
      });
    }
  }

  cancelListenWorkspace(idWorkspace) {
    if (!idWorkspace) {
      return;
    }

    if (this.listenerCount[idWorkspace]) {
      this.listenerCount[idWorkspace] += -1;
    }
    if (!this.listenerCount[idWorkspace] || this.listenerCount[idWorkspace] == 0) {
      ws.unsubscribe('workspace/' + idWorkspace);
    }
  }
}

const service = new ListenWorkspace();
export default service;
