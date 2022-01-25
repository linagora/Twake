import { UserType } from 'app/features/users/types/user';
import Logger from 'app/services/Logger';
import AccessRightsService from 'app/services/AccessRightsService';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import Languages from 'app/services/languages/languages';
import JWT from 'app/services/JWTStorage';
import Collections from 'app/services/Collections/Collections';
import Globals from 'app/services/Globals';
import UserNotifications from 'app/features/users/services/user-notifications-service';
import WorkspacesListener from './workspaces/WorkspacesListener';
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

    const ws = WebSocket.get();

    ws.connect();
    this.configureCollections(user);

    WorkspacesListener.startListen();
    AccessRightsService.resetLevels();

    UserNotifications.start();
    CurrentUser.start();
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
            headers: () => {
              return {
                Authorization: JWT.getAutorizationHeader(),
              };
            },
          },
        },
      };
      Collections.connect(options);
    }
  }
}

export default new Application();
