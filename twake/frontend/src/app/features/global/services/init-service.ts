import Logger from 'app/features/global/framework/logger-service';
import Observable from 'app/deprecated/Observable/Observable';
import Api from 'app/features/global/framework/api-service';

export type ConsoleConfiguration = {
  authority: string;
  client_id: string;
  max_unverified_days: number;
  account_management_url: string;
  company_subscription_url: string;
  company_management_url: string;
  collaborators_management_url: string;
};

export type InternalConfiguration = {
  disable_account_creation: boolean;
  disable_email_verification: boolean;
};

export type ServerInfoType = null | {
  status: 'ready';
  version: {
    current: string;
    minimal: {
      web: string;
      mobile: string;
    };
  };
  branding?: {
    logo: string;
  };
  auth: Array<string>;
  configuration: {
    branding: any;
    help_url: string | null;
    pricing_plan_url: string | null;
    accounts: {
      type: 'console' | 'internal';
      console?: ConsoleConfiguration;
      internal?: InternalConfiguration;
    };
  };
};

class InitService extends Observable {
  public server_infos: ServerInfoType = null;
  public server_infos_loaded: boolean = false;
  public app_ready: boolean = false;
  private logger = Logger.getLogger('InitService');

  async getServer() {
    return await Api.get<ServerInfoType>('/internal/services/general/v1/server', undefined, false, {
      disableJWTAuthentication: true,
    });
  }

  async init() {
    this.server_infos = await this.getServer();

    if (this.server_infos?.status !== 'ready') {
      this.logger.debug('Server is not ready', this.server_infos);
      this.app_ready = false;
      this.notify();
      setTimeout(() => {
        this.init();
      }, 1000);
    } else {
      this.logger.debug('Server is ready', this.server_infos);
      this.server_infos_loaded = true;
      this.app_ready = true;
      this.notify();
    }
  }
}

export default new InitService();
