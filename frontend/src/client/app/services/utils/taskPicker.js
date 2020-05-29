import Observable from 'services/observable.js';
import Api from 'services/api.js';
import Context from 'apps/context.js';

import Globals from 'services/Globals.js';

class taskPicker extends Observable {
  constructor() {
    super();
    this.observableName = 'taskPicker';
    this.tasks = [];
    this.refresh = false;
    this.searchInput = '';
    this.searchLabel = '';
    this.timeOutSearch = setTimeout(() => {}, 0);
  }

  // restriction: all, workspace, group
  getTasks(name, restriction, workspaceId, groupId, withTimeout, callback) {
    if (Context.getWorkspace().id != workspaceId && !withTimeout) {
      this.isLoading = true;
    } else {
      this.tasks = Context.searchTasksByName(name);
    }
    this.notify();

    var data = {
      name: name,
      workspaceId: workspaceId,
      restriction: restriction,
      groupId: groupId,
    };
    var timeOut = withTimeout ? 2000 : 0;
    var that = this;
    clearTimeout(this.timeOutSearch);
    this.timeOutSearch = setTimeout(function() {
      if (data.name != '') {
        //TODO
        /** Api.post("", data, function (res) {
                    that.tasks = res.data;
                    that.isLoading = false;
                    that.notify();
                }); */
      }
    }, timeOut);
  }
}

const TaskPicker = new taskPicker();
export default TaskPicker;
