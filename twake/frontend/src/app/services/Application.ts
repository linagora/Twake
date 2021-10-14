import { UserType } from 'app/models/User';
import Logger from 'app/services/Logger';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import Workspaces from 'app/services/workspaces/workspaces';
import Groups from 'app/services/workspaces/groups';
import AccessRightsService from 'app/services/AccessRightsService';
import CurrentUser from 'app/services/user/CurrentUser';
import Languages from 'app/services/languages/languages';
import JWT from 'app/services/JWTStorage';
import Collections from 'app/services/Collections/Collections';
import Globals from 'app/services/Globals';
import UserNotifications from 'app/services/user/UserNotifications';
import ws from 'app/services/websocket';
import WorkspacesListener from './workspaces/WorkspacesListener';
import WorkspaceAPIClient from './workspaces/WorkspaceAPIClient';
import UserNotificationAPIClient from './user/UserNotificationAPIClient';
import { CompanyType } from 'app/models/Company';
import { WorkspaceType } from 'app/models/Workspace';
import LocalStorage from './LocalStorage';
import WebSocket from './WebSocket/WebSocket';

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

    await WebSocket.get().connect();
    this.configureCollections(user);

    WorkspacesListener.startListen();

    DepreciatedCollections.get('users').updateObject(user);
    AccessRightsService.resetLevels();

    await this.setupWorkspaces(user);

    UserNotifications.start();
    CurrentUser.start();
    user.language && Languages.setLanguage(user.language);

    ws.onReconnect('login', () => {
      this.logger.info('WS Reconnected');
      // TODO: Get the last user data
    });
  }

  stop(): void {
    WorkspacesListener.cancelListen();
    LocalStorage.clear();
    Collections.clear();
    JWT.clear();
  }

  private configureCollections(user: UserType) {
    if (user?.id) {
      const options = {
        storageKey: user.id,
        transport: {
          socket: WebSocket.get(),
          rest: {
            url: `${Globals.api_root_url}/internal/services`,
            headers: {
              // TODO: The token can expire if we do not renew it in the later uses of this header
              // Instead of doing this, we should have a function which is called when header needs to be used
              Authorization: JWT.getAutorizationHeader(),
            },
          },
        },
      };
      Collections.connect(options);
    }
  }

  private async setupWorkspaces(user: UserType) {
    const companies = await WorkspaceAPIClient.listCompanies(user.id!);
    const workspaces = new Map<string, WorkspaceType[]>();
    const notifications = await UserNotificationAPIClient.getAllCompaniesBadges();

    for(const company of companies) {
      const companyWorkspaces = await WorkspaceAPIClient.list(company.id);

      companyWorkspaces.forEach(workspace => Workspaces.addToUser(workspace));
      workspaces.set(company.id, companyWorkspaces || []);
      Groups.addToUser({...company, ...{_user_hasnotifications: hasNotification(company)}});
    }

    const defaultCompany = companies[0];
    const defaultCompanyWorkspaces = workspaces.get(defaultCompany.id);
    // TODO: get default workspace
    const defaultWorkspace = defaultCompanyWorkspaces?.length ? defaultCompanyWorkspaces[0] : '';

    Groups.select(defaultCompany);
    Workspaces.select(defaultWorkspace, true);

    function hasNotification(company: CompanyType): boolean {
      const notification = notifications.find(n => n.company_id === company.id);

      return !!notification && notification.count > 0;
    }
  }
}

export default new Application();