import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
}

export interface UsersServiceAPI extends TwakeServiceProvider, Initializable {
  // TODO
}
