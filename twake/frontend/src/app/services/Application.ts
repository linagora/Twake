import { UserType } from 'app/models/User';
import Logger from 'app/services/Logger';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import Workspaces from 'app/services/workspaces/workspaces';
import Groups from 'app/services/workspaces/groups';
import AccessRightsService from 'app/services/AccessRightsService';
import CurrentUser from 'app/services/user/CurrentUser';
import Languages from 'app/services/languages/languages';
import JWT from 'app/services/JWTService';
import Collections from 'app/services/Collections/Collections';
import Globals from 'app/services/Globals';
import UserNotifications from 'app/services/user/UserNotifications';

class Application {
  private logger: Logger.Logger;

  constructor() {
    this.logger = Logger.getLogger('Application');
  }

  /**
   * Start the Twake application: Starting all the required services for the given user
   */
  start(user: UserType): void {
    this.logger.info('Starting application for user', user.id);
    this.configureCollections(user);

    DepreciatedCollections.get('users').updateObject(user);
    AccessRightsService.resetLevels();

    user.workspaces.forEach((workspace: { group: any; }) => {
      Workspaces.addToUser(workspace);
      Groups.addToUser(workspace.group);
    });

    UserNotifications.start();
    CurrentUser.start();
    user.language && Languages.setLanguage(user.language);
  }

  configureCollections(user: UserType) {
    if (user?.id) {
      Collections.setOptions({
        storageKey: user.id,
        transport: {
          socket: {
            url: Globals.environment.websocket_url,
            authenticate: async () => {
              let token = JWT.getToken();
              if (JWT.isAccessExpired()) {
                await new Promise(resolve => {
                  // FIXME: This lives in login.js...
                  // FIXME: This must update the user
                  console.log("FIXME, update user");
                  resolve(null);
                  //this.updateUser(resolve);
                });
                token = JWT.getToken();
              }
              return {
                token,
              };
            },
          },
          rest: {
            url: `${Globals.api_root_url}/internal/services`,
            headers: {
              // TODO: The token can expire if we do not renew it in the later uses of this header
              // Instead of doing this, we should have a function which is called when header needs to be used
              Authorization: JWT.getAutorizationHeader(),
            },
          },
        },
      });
      Collections.connect();
    }
  }
}

export default new Application();