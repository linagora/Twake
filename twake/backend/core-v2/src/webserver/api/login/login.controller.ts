import { Controller, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from '../../auth/auth.service';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';

@Controller()
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("/auth/login")
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}