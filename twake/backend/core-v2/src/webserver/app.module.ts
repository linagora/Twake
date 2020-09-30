import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './api/users/users.module';
import { WebConfigModule } from './configuration/configuration.module';
import { AuthModule } from './auth/auth.module';
import { LoginModule } from './api/login/login.module';

@Module({
  imports: [AuthModule, WebConfigModule, UsersModule, LoginModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
