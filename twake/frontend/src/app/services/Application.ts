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
import WorkspacesListener from './workspaces/WorkspacesListener';
import WorkspaceAPIClient from './workspaces/WorkspaceAPIClient';
import UserNotificationAPIClient from './user/UserNotificationAPIClient';
import { CompanyType } from 'app/models/Company';

class Application {
  private logger: Logger.Logger;
  private started = false;

  constructor() {
    this.logger = Logger.getLogger('Application');
  }

  /**
   * Start the Twake application: Starting all the required services for the given user
   */
  async start(user: UserType): Promise<void> {
    if (this.started) {
      this.logger.info('Application is already started');
      return;
    }
    this.started = true;
    this.logger.info('Starting application for user', user);
    this.configureCollections(user);

    WorkspacesListener.startListen();

    DepreciatedCollections.get('users').updateObject(user);
    AccessRightsService.resetLevels();

    await this.setupWorkspaces(user);

    UserNotifications.start();
    CurrentUser.start();
    user.language && Languages.setLanguage(user.language);
  }

  stop(): void {
    WorkspacesListener.cancelListen();
  }

  private configureCollections(user: UserType) {
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

  private async setupWorkspaces(user: UserType) {
    const companies = await WorkspaceAPIClient.listCompanies(user.id!);
    const notifications = await UserNotificationAPIClient.getAllCompaniesBadges();

    companies.forEach(async company => {
      const workspaces = await WorkspaceAPIClient.list(company.id);
      workspaces.forEach(workspace => Workspaces.addToUser(workspace));
      Groups.addToUser({...company, ...{_user_hasnotifications: hasNotification(company)}});
    });

    function hasNotification(company: CompanyType): boolean {
      const notification = notifications.find(n => n.company_id === company.id);

      return !!notification && notification.count > 0;
    }
  }
}

export default new Application();