import { TwakeServiceProvider } from "../../core/platform/framework/api";
import User from "./entity/user";

export default interface UserServiceAPI extends TwakeServiceProvider {
  get(id: string): Promise<User>;
}
