import { Controller, Get, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import User from "../../../core/user/models";
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller("/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUsers(): Array<User> {
    return [this.usersService.getCurrent()];
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getUser(@Param("id") id: string): Promise<User> {
    return this.usersService.get(id);
  }

  @Delete(":id")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async delete(@Param("id") id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
