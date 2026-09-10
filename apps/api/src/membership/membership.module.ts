import { Module } from '@nestjs/common';
import { MembershipController } from './membership.controller';

@Module({
  controllers: [MembershipController],
})
export class MembershipModule {}
