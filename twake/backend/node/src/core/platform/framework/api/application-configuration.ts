import { TwakeServiceOptions } from "./service-options";
import { TwakeServiceConfiguration } from "./service-configuration";

export class TwakeAppConfiguration extends TwakeServiceOptions<TwakeServiceConfiguration> {
  services: Array<string>;
  servicesPath: string;
}
