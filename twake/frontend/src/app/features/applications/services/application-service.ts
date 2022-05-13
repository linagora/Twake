import { UserType } from 'app/features/users/types/user';
import Logger from 'app/features/global/framework/logger-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import Languages from 'app/features/global/services/languages-service';
import JWT from 'app/features/auth/jwt-storage-service';
import Collections from 'app/deprecated/CollectionsV2/Collections';
import Globals from 'app/features/global/services/globals-twake-app-service';
import WorkspacesListener from '../../workspaces/services/workspaces-listener-service';
import LocalStorage from '../../global/framework/local-storage-service';
import WebSocket from '../../global/types/websocket-types';

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
