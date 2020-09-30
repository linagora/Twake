import { Injectable } from '@nestjs/common';
import CoreUser from "../../../core/user";
import User from "../../../core/user/models";

@Injectable()
export class UsersService {
  getCurrent(): User {
    return CoreUser.get("123");
  }

  async findByUsername(username): Promise<User | undefined> {
    return CoreUser.findByUsername(username);
  }

  async delete(id: string): Promise<void> {
    return CoreUser.remove(id);
  }

  async get(id: string): Promise<User | undefined> {
    return CoreUser.get(id);
  }
}
