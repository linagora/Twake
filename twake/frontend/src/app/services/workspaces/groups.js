import Observable from 'app/services/Depreciated/observable.js';
import Api from 'services/Api';
import ws from 'services/websocket.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import ListenGroups from './listen_groups.js';
import $ from 'jquery';
import JWTStorage from 'services/JWTStorage';

import Globals from 'services/Globals';

class Groups extends Observable {
  constructor() {
    super();
    this.setObservableName('groups');
    this.currentGroupId = null;

    this.user_groups = {};
    Globals.window.gs = this;
  }

  select(group) {
    if (this.currentGroupId === group.id) {
      return;
    }

    if (!group.id) {
      return;
    }

    if (this.currentGroupId) {
      ListenGroups.cancelListenGroup(this.currentGroupId);
    }
    ListenGroups.listenGroup(group.id);

    this.currentGroupId = group.id;
    Workspaces.changeGroup(group);
    this.notify();
  }

  addToUser(group) {
    var current_group = Collections.get('groups').find(group.id);
    if (current_group && current_group._user_hasnotifications) {
      group._user_hasnotifications =
        group._user_hasnotifications || current_group._user_hasnotifications;
    }

    var id = group.id;
    Collections.get('groups').updateObject(group);
    this.user_groups[id] = Collections.get('groups').known_objects_by_id[id];
  }

  getOrderedGroups() {
    return Object.keys(this.user_groups)
      .map(id => this.user_groups[id])
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  updateName(name) {
    var that = this;
    this.loading = true;
    this.notify();
    Api.post('workspace/group/data/name', { groupId: this.currentGroupId, name: name }, res => {
      if (res.errors.length === 0) {
        var group = { id: that.currentGroupId, name: name };
        Collections.get('groups').updateObject(group);
        ws.publish('group/' + group.id, { data: { group: group } });
      }
      that.loading = false;
      that.notify();
    });
  }
  updateLogo(logo) {
    this.loading = true;
    this.notify();
    var route = `${Globals.api_root_url}/ajax/workspace/group/data/logo`;

    var data = new FormData();
    if (logo !== false) {
      data.append('logo', logo);
    }
    data.append('groupId', this.currentGroupId);
    var that = this;

    $.ajax({
      url: route,
      type: 'POST',
      data: data,
      cache: false,
      contentType: false,
      processData: false,

      headers: {
        Authorization: JWTStorage.getAutorizationHeader(),
      },
      xhrFields: {
        withCredentials: true,
      },
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr();
        myXhr.onreadystatechange = function () {
          if (myXhr.readyState === XMLHttpRequest.DONE) {
            that.loading = false;
            var resp = JSON.parse(myXhr.responseText);
            if (resp.errors.indexOf('badimage') > -1) {
              that.error_identity_badimage = true;
            } else {
              var group = resp.data;
              Collections.get('groups').updateObject(group);
              ws.publish('group/' + group.id, { data: { group: group } });
            }
            that.notify();
          }
        };
        return myXhr;
      },
    });
  }
}

const service = new Groups();
export default service;
