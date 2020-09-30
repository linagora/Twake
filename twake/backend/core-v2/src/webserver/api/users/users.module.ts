import { Module } from '@nestjs/common';
// import { AuthModule } from '../../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  // this gives a circular dependency, anyway it works without importing it...
  //imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
