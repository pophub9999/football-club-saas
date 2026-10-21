import { Module } from '@nestjs/common';
import { MembershipController } from './membership.controller';
import { DuesController } from './dues.controller';
import { DuesService } from './dues.service';

@Module({
  controllers: [MembershipController, DuesController],
  providers: [DuesService],
})
export class MembershipModule {}
