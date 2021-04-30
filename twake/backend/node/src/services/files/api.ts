import { Readable, Stream } from "node:stream";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";

export interface FileServiceAPI extends TwakeServiceProvider, Initializable {
  save(stream: any): any;
  download(path: any): Promise<Readable>;
}
