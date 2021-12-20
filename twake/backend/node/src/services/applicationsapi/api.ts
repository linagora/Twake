import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import AuthServiceAPI from "../../core/platform/services/auth/provider";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../applications/api";

export interface ApplicationsApiServiceAPI extends TwakeServiceProvider, Initializable {
  readonly platformService: PlatformServicesAPI;
  readonly applicationService: ApplicationServiceAPI;
  readonly authService: AuthServiceAPI;
}
