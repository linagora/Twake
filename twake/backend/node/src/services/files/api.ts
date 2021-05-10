import { Readable, Stream } from "node:stream";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import { CompanyExecutionContext } from "./web/types";

export interface FileServiceAPI extends TwakeServiceProvider, Initializable {
  save(stream: any, context: CompanyExecutionContext): any;
  download(company_id: string, id: string, context: CompanyExecutionContext): Promise<Readable>;
}
