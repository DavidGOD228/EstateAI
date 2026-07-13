import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

// Registers the User repository for injection; re-exports TypeOrmModule so
// AuthModule (and anything else that needs Repository<User>) can import this
// module instead of re-registering the entity feature itself.
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
