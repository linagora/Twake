import { ApplicationsApiServiceAPI } from "../api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../applications/api";
import AuthServiceAPI from "../../../core/platform/services/auth/provider";

export function getService(
  platformService: PlatformServicesAPI,
  applicationService: ApplicationServiceAPI,
  authService: AuthServiceAPI,
) {
  return new ApplicationsApiService(platformService, applicationService, authService);
}

class ApplicationsApiService implements ApplicationsApiServiceAPI {
  version: "1";

  constructor(
    readonly platformService: PlatformServicesAPI,
    readonly applicationService: ApplicationServiceAPI,
    readonly authService: AuthServiceAPI,
  ) {}

  async init(): Promise<this> {
    return this;
  }
}
