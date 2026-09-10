import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { Request } from 'express';

@Controller('membership')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMyMembership(@UserRequest() request: Request) {
    const user = request.user!;

    const member = await this.prisma.member.findFirst({
      where: { userId: user.id, tenantId: user.tenantId },
      include: {
        memberships: {
          where: { tenantId: user.tenantId },
          orderBy: { validFrom: 'desc' },
        },
        dues: {
          where: { tenantId: user.tenantId },
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            reference: true,
            description: true,
            amount: true,
            paidAmount: true,
            currency: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member profile is not linked to this club');
    }

    return {
      member: {
        id: member.id,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
      },
      memberships: member.memberships,
      dues: member.dues,
    };
  }
}
