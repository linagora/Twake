import Observable from 'app/services/Depreciated/observable.js';
import Api from 'services/Api';
import Collections from 'app/services/Depreciated/Collections/Collections.js';

import Globals from 'services/Globals';

type TableState = {
  loaded: number;
  list: any;
  nextPageToken: string;
};

class WorkspacesMembersTable extends Observable {
  tables: { [key: string]: { [key: string]: TableState } } = {};
  searched: any[] = [];

  constructor() {
    super();
    this.setObservableName('workspacesMembersTable');
    //@ts-ignore
    Globals.window.WorkspacesMembersTable = this;
  }

  search(
    workspaceId: string,
    type: string,
    query: string,
    max: number,
    callback: (res: any[]) => void,
  ) {
    const data = {
      workspaceId: workspaceId,
      query: query,
      max: max,
    };
    Api.post('workspace/members/list', data, (res: any) => {
      const data = res.data;
      if (data && data.list) {
        Object.values(data.list).map((o: any) => Collections.get('users').updateObject(o?.user));
        Object.keys(data.list).map(id => this.updateElement(workspaceId, type, id, data.list[id]));
        callback(Object.values(data.list));
      } else {
        callback([]);
      }
    });
  }

  nextPage(workspaceId: string, type: string, max: number, fromStart: boolean) {
    return new Promise(resolve => {
      let route = 'workspace/members/list';
      if (type === 'pending') {
        route = 'workspace/members/pending';
      }

      this.tables[workspaceId] = this.tables[workspaceId] || {};
      this.tables[workspaceId][type] = this.tables[workspaceId][type] || {
        list: {},
      };

      let offset = '';
      if (!fromStart) {
        offset = this.tables[workspaceId][type].nextPageToken;
      } else {
        this.tables[workspaceId][type].loaded = 0;
        this.tables[workspaceId][type].list = {};
      }

      const data = {
        workspaceId: workspaceId,
        offset: offset,
        max: max,
      };
      Api.post(route, data, (res: any) => {
        const data = res.data;
        if (data && data.list) {
          if (type !== 'pending')
            Object.values(data.list).map((o: any) =>
              Collections.get('users').updateObject(o?.user),
            );

          this.tables[workspaceId][type].list = Object.assign(
            this.tables[workspaceId][type].list,
            res.data.list,
          );
          this.tables[workspaceId][type].loaded = Object.values(
            this.tables[workspaceId][type].list,
          ).length;
          this.tables[workspaceId][type].nextPageToken = data.nextPageToken;
        } else {
          console.log('Unable to load more members', res);
        }
        resolve(this.tables[workspaceId][type]);
      });
    });
  }

  updateElement(workspaceId: string, type: string, user_id: string, object: string) {
    this.tables[workspaceId] = this.tables[workspaceId] || {};
    this.tables[workspaceId][type] = this.tables[workspaceId][type] || {
      list: {},
    };

    if (this.tables[workspaceId] && this.tables[workspaceId][type]) {
      this.tables[workspaceId][type].list[user_id] = object;
      this.notify();
    }
  }

  removeElement(workspaceId: string, type: string, user_id: string) {
    if (this.tables[workspaceId] && this.tables[workspaceId][type]) {
      delete this.tables[workspaceId][type].list[user_id];
      this.notify();
    }
  }

  getElement(workspaceId: string, type: string, user_id: string) {
    if (this.tables[workspaceId] && this.tables[workspaceId][type]) {
      return this.tables[workspaceId][type].list[user_id];
    }
    return null;
  }

  getList(workspaceId: string, type: string) {
    if (this.tables[workspaceId] && this.tables[workspaceId][type]) {
      return this.tables[workspaceId][type].list || {};
    }
    return {};
  }
}

const service = new WorkspacesMembersTable();
export default service;
