import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider } from "../../core/platform/framework/api";
import { Channel } from "./entities";

export default interface ChannelServiceAPI extends TwakeServiceProvider, CRUDService<Channel>{
}
