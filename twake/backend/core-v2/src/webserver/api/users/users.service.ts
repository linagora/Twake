import { Injectable } from '@nestjs/common';
import CoreUser from "../../../core/user";
import User from "../../../core/user/models";

@Injectable()
export class UsersService {
  getCurrent(): User {
    return CoreUser.get("123");
  }

  delete(id: string): void {
    return CoreUser.remove(id);
  }

  get(id: string): User {
    return CoreUser.get(id);
  }
}
