import Observable from 'services/Observable/Observable';
import Api from 'services/Api';
import Websocket from 'services/websocket.js';
import RouterServices from 'app/services/RouterService';
import { ConfigurationType } from 'app/models/Configuration';

type ServerInfoType = {
  branding?: any;
  websocket_public_key?: string;
  auth?: ConfigurationType['auth'];
  ready?:
    | true
    | {
        elasticsearch_connection: boolean;
        elasticsearch_mapping: boolean;
        db_connection: boolean;
        db_mapping: boolean;
        init: boolean;
      };
  help_link?: string;
};

class InitService extends Observable {
  public server_infos: ServerInfoType = {};
  public server_infos_loaded: boolean = false;
  public app_ready: boolean = false;

  async init() {
    const res: any = await Api.get('core/version', null, false, { disableJWTAuthentication: true });

    if (!res.data) {
      res.data = {};
    }
    this.server_infos = res.data;
    this.server_infos.branding = this.server_infos.branding ? this.server_infos.branding : {};
    this.server_infos_loaded = true;

    if (this.server_infos.ready !== true && this.server_infos.ready !== undefined) {
      //Server is not ready
      RouterServices.history.replace(
        RouterServices.addRedirection(RouterServices.pathnames.SETUP),
        {
          ...this.server_infos.ready,
        },
      );
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
