import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './api/users/users.module';
import { WebConfigModule } from './configuration/configuration.module';

@Module({
  imports: [WebConfigModule, UsersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
