import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Context from 'apps/context.js';

import Globals from 'services/Globals.js';

class userPicker extends Observable {
  constructor() {
    super();
    this.observableName = 'userPicker';
    this.users = [];
    this.refresh = false;
    this.searchInput = '';
    this.searchLabel = '';
    this.timeOutSearch = setTimeout(() => {}, 0);
  }
  init() {
    this.users = Context.searchMembersByUsername('');
  }
  // restriction: all, workspace, group
  getUsers(username, restriction, workspaceId, groupId, withTimeout, callback) {
    console.log('get user ' + username + ', ' + withTimeout);
    if (Context.getWorkspace().id != workspaceId && !withTimeout) {
      this.isLoading = true;
    } else {
      this.users = Context.searchMembersByUsername(username);
    }
    this.notify();

    var data = {
      username: username,
      workspaceId: workspaceId,
      restriction: restriction,
      groupId: groupId,
    };
    var timeOut = withTimeout ? 2000 : 0;
    var that = this;
    clearTimeout(this.timeOutSearch);
    this.timeOutSearch = setTimeout(function() {
      if (data.username != '') {
        Api.post('users/contacts/search/users', data, function(res) {
          that.users = res.data;
          that.isLoading = false;
          that.notify();
        });
      }
    }, timeOut);
  }
}

const UserPicker = new userPicker();
export default UserPicker;
