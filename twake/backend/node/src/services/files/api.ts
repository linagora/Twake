import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";

export interface FileServiceAPI extends TwakeServiceProvider, Initializable {
  save(stream: any): any;
}
