import ws from 'services/websocket.js';
import Workspaces from 'services/workspaces/workspaces.js';
import User from 'app/features/users/services/current-user-service';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import LoginService from 'app/services/login/LoginService';
import { RightsOrNone } from '../AccessRightsService';
import Logger from 'services/Logger';

type WebsocketWorkspace = {
  type: 'remove' | 'add' | 'update_group_privileges' | 'update_workspace_level';
  group_id: string;
  workspace_id: string;
  level: RightsOrNone;
  workspace: any; // TODO
  privileges: any; // TODO
};

class WorkspacesListener {
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('WorkspacesListener');
  }

  startListen() {
    this.logger.debug('Start listener');

    ws.subscribe(
      `workspaces_of_user/${User.getCurrentUserId()}`,
      (_uri: any, data: WebsocketWorkspace) => {
        this.logger.debug('Got a message', data);
        LoginService.updateUser();

        if (data.workspace) {
          if (data.type === 'remove') {
            Workspaces.removeFromUser(data.workspace);
            Workspaces.notify();
          } else if (data.type === 'add') {
            Workspaces.notify();
          }
        }
      },
      null,
    );
  }

  cancelListen() {
    this.logger.debug('Cancel listener');
    ws.unsubscribe(`workspaces_of_user/${User.getCurrentUserId()}`, null, null);
  }
}

export default new WorkspacesListener();
