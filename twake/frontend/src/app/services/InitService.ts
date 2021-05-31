import Observable from 'services/Observable/Observable';
import Api from 'services/Api';

type ServerInfoType = null | {
  status: 'ready';
  version: {
    current: string;
    minimal: {
      web: string;
      mobile: string;
    };
  };
  configuration: {
    branding: any;
    help_link: string | null;
    accounts: {
      type: 'console' | 'internal';
      console: null | {
        max_unverified_days: number;
        account_management_url: string;
        company_management_url: string;
        collaborators_management_url: string;
      };
      internal: null | {
        disable_account_creation: boolean;
        disable_email_verification: boolean;
      };
    };
  };
};

class InitService extends Observable {
  public server_infos: ServerInfoType = null;
  public server_infos_loaded: boolean = false;
  public app_ready: boolean = false;

  async init() {
    this.server_infos = (await Api.get('/internal/services/general/v1/server', null, false, {
      disableJWTAuthentication: true,
    })) as ServerInfoType;

    this.server_infos_loaded = true;

    if (this.server_infos?.status !== 'ready') {
      this.app_ready = false;
      this.notify();
      setTimeout(() => {
        this.init();
      }, 1000);
    } else {
      this.app_ready = true;
      this.notify();
    }
  }
}

export default new InitService();
