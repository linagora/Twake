import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface ChannelServiceAPI<T> extends TwakeServiceProvider, CRUDService<T>{
}
