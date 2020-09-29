import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './api/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
