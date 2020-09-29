import { Controller, Get, Delete, HttpCode, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import User from "../../../core/user/models";

@Controller("/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(): Array<User> {
    return [this.usersService.getCurrent()];
  }

  @Get(":id")
  getUser(@Param("id") id: string): User {
    return this.usersService.get(id);
  }

  @Delete(":id")
  @HttpCode(204)
  delete(@Param("id") id: string): void {
    return this.usersService.delete(id);
  }
}
