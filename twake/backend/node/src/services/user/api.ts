import { CRUDService, ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework/api";
import User, { UserPrimaryKey } from "./entities/user";

export default interface UserServiceAPI extends TwakeServiceProvider, Initializable {
  users: UsersServiceAPI;
}

export interface UsersServiceAPI extends TwakeServiceProvider, Initializable, CRUDService<
  User,
  UserPrimaryKey,
  ExecutionContext
> {
  
}
