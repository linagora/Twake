import workspaceService from 'services/workspaces/workspaces.js';
import Observable from 'services/observable';
import Api from 'services/api.js';

/**
 *   this service is to manage user popup when click on username
 **/

import Globals from 'services/Globals.js';

class UserPopup extends Observable {
  constructor() {
    super();
    this.observableName = 'userPopupService';
    this.isShowing = false;
    this.userShowing = {};
    this.status = '';
  }
  initRelation(id) {
    var data = {
      user_id: id,
    };
    var that = this;
    Api.post('users/contacts/get', data, function(res) {
      that.status = res.data;
      that.notify();
    });
  }
  setUser(user) {
    if (user) {
      this.status = '';
      this.initRelation(user.id);
      this.userShowing = user;
      this.isShowing = true;
    } else {
      this.isShowing = false;
    }
    this.notify();
  }
}
var service = new UserPopup();
export default service;
