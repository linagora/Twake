import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import User from 'services/user/user.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import groupService from 'services/workspaces/groups.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Numbers from 'services/utils/Numbers.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import CurrentUser from 'services/user/current_user.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import UsersService from 'services/user/user.js';

import Globals from 'services/Globals.js';

type TableState = {
  loaded: number;
  list: any;
  nextPageToken: string;
};

class WorkspacesMembersTable extends Observable {
  tables: { [key: string]: { [key: string]: TableState } } = {};

  constructor() {
    super();
    this.setObservableName('workspacesMembersTable');
    //@ts-ignore
    Globals.window.WorkspacesMembersTable = this;
  }

  search(workspaceId: string, type: string, query: string, max: number) {
    return new Promise(resolve => {
      UsersService.search(query, { scope: 'workspace', workspace_id: workspaceId }, (res: any) => {
        console.log(res);
        resolve(res);
      });
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
      }

      const data = {
        workspaceId: workspaceId,
        offset: offset,
        max: max,
      };
      Api.post(route, data, (res: any) => {
        const data = res.data;
        if (data.list) {
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
}

const service = new WorkspacesMembersTable();
export default service;
