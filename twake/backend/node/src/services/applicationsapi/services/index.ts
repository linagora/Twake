import { ApplicationsApiServiceAPI } from "../api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../applications/api";

export function getService(platformService: PlatformServicesAPI,  applicationService: ApplicationServiceAPI) {
  return new ApplicationsApiService(platformService,
    applicationService)
}

class ApplicationsApiService implements ApplicationsApiServiceAPI {
  version: "1";

  constructor(readonly platformService: PlatformServicesAPI, readonly applicationService: ApplicationServiceAPI) {}

  async init(): Promise<this> {
    return this;
  }

}
