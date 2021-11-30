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
import LocalStorage from './LocalStorage';
import WebSocket from './WebSocket/WebSocket';
import RouterService from './RouterService';
import CompanyAPIClient from './CompanyAPIClient';
import { getBestCandidateWorkspace } from 'app/state/recoil/utils/BestCandidateUtils';

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

  /**
   * Setup workspaces based on company id
   *
   * Company priority:
   * 1. Router company id
   * 2. Local storage company id
   * 3. User's company with the most total members
   *
   * Workspace priority:
   * 1. Router workspace id
   * 2. Local storage workspace id
   * 3. User's workspace with the most total members
   *
   * @param user
   */
  private async setupWorkspaces(user: UserType) {
    const companyId = RouterService.getStateFromRoute().companyId;
    const company = companyId ? await CompanyAPIClient.get(companyId) : undefined;

    if (!company) return this.logger.error(`Error, company is ${company}`);

    const workspaces = await WorkspaceAPIClient.list(company.id);

    const notifications = await UserNotificationAPIClient.getAllCompaniesBadges();

    workspaces
      .filter(w => user.workspaces_id?.includes(w.id))
      .forEach(w => Workspaces.addToUser(w));

    // TODO we should find a better way to do this
    // Everything related to observable takes time ...
    Groups.addToUser({ ...company, ...{ _user_hasnotifications: hasNotification(company) } });

    AccessRightsService.updateCompanyLevel(
      company.id,
      company.role === 'admin' || company.role === 'owner'
        ? 'admin'
        : company.role === 'guest'
        ? 'guest'
        : 'member',
    );

    // TODO we should find a better way to do this
    // Everything related to observable takes time ...
    Groups.select(company);

    const bestCandidateWorkspace = getBestCandidateWorkspace(company.id, workspaces);

    bestCandidateWorkspace && Workspaces.select(bestCandidateWorkspace, true);

    Workspaces.notify();

    function hasNotification(company: CompanyType): boolean {
      const notification = notifications.find(n => n.company_id === company.id);

      return !!notification && notification.count > 0;
    }
  }
}

export default new Application();
