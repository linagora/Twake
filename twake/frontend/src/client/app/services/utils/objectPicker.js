import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Context from 'apps/context.js';
import filePickerService from 'apps/Drive/services/filePicker.js';

import Globals from 'services/Globals.js';

class objectPicker extends Observable {
  constructor() {
    super();

    this.observableName = 'objectPicker';
    this.objects = ['Files', 'Event', 'Tasks', 'Subjects'];
    this.refresh = false;
    this.searchInput = '';
    this.searchLabel = '';
    this.isSearching = false;
    this.moduleApps = [];
    this.links = {};
  }

  loadCache(id, type, cache) {
    if (!this.links[type]) {
      this.links[type] = {};
    }
    if (!this.links[type][id]) {
      this.links[type][id] = cache;
      this.notify();
    }
  }

  getLinks(id, type, callback) {
    if (!id) {
      return;
    }
    var data = {
      id: id,
      type: type,
    };
    if (!this.links[type]) {
      this.links[type] = {};
    }
    var that = this;
    Api.post('objectLinks/get', data, function(res) {
      that.links[type][id] = [];
      filePickerService.exception = [];
      if (res.errors.length == 0) {
        that.links[type][id] = res.data;
        that.notify();
        if (callback) callback();
      }
    });
  }

  makeLink(typeA, idA, typeB, idB, callback) {
    var that = this;
    var data = {
      typeA: typeA,
      idA: idA,
      typeB: typeB,
      idB: idB,
    };
    Api.post('objectLinks/create', data, function(res) {
      if (res.data == 'success') {
        if (callback) {
          callback();
        }
        that.getLinks(idA, typeA);
      } else {
      }
    });
  }

  deleteLink(idA, typeA, idB, typeB) {
    var that = this;
    var data = {
      typeA: typeA,
      idA: idA,
      typeB: typeB,
      idB: idB,
    };
    Api.post('objectLinks/delete', data, function(res) {
      if (res.errors.length == 0) {
        that.getLinks(idA, typeA);
      }
    });
  }

  load() {
    this.loadApps();
  }

  loadApps() {
    var that = this;
    var data = { workspaceId: Context.workspace.id };
    Api.post('workspace/apps/get', data, function(res) {
      if (res.errors.length == 0) {
        that.moduleApps = res.data.apps;
        that.notify();
      }
    });
  }
}

const ObjectPicker = new objectPicker();
export default ObjectPicker;
