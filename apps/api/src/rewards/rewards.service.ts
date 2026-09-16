import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string, tenantId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ balance: number; lifetime_earned: number; lifetime_redeemed: number }>>(Prisma.sql`
      SELECT balance, lifetime_earned, lifetime_redeemed
      FROM reward_accounts
      WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1`);
    return rows[0] ?? { balance: 0, lifetime_earned: 0, lifetime_redeemed: 0 };
  }

  async getCatalog(tenantId: string) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT id, name, description, points_cost, stock, is_active, created_at
      FROM rewards
      WHERE tenant_id = ${tenantId}::uuid AND is_active = TRUE
      ORDER BY points_cost ASC, name ASC`);
  }

  async getLedger(userId: string, tenantId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT id, points, reason, reference, metadata, created_at
      FROM reward_ledger
      WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`);
  }

  async redeem(userId: string, tenantId: string, rewardId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rewards = await tx.$queryRaw<Array<{ id: string; points_cost: number; stock: number | null; is_active: boolean; name: string }>>(Prisma.sql`
        SELECT id, points_cost, stock, is_active, name
        FROM rewards
        WHERE id = ${rewardId}::uuid AND tenant_id = ${tenantId}::uuid
        FOR UPDATE`);
      const reward = rewards[0];
      if (!reward || !reward.is_active) throw new NotFoundException('Reward not found');
      if (reward.stock !== null && reward.stock <= 0) throw new BadRequestException('Reward out of stock');

      const accounts = await tx.$queryRaw<Array<{ id: string; balance: number }>>(Prisma.sql`
        SELECT id, balance FROM reward_accounts
        WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid
        FOR UPDATE`);
      const account = accounts[0];
      const balance = account?.balance ?? 0;
      if (balance < reward.points_cost) throw new BadRequestException('Insufficient reward points');

      if (!account) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO reward_accounts (tenant_id, user_id, balance, lifetime_earned, lifetime_redeemed)
          VALUES (${tenantId}::uuid, ${userId}::uuid, 0, 0, 0)`);
      }
      await tx.$executeRaw(Prisma.sql`
        UPDATE reward_accounts
        SET balance = balance - ${reward.points_cost}, lifetime_redeemed = lifetime_redeemed + ${reward.points_cost}, updated_at = NOW()
        WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid`);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO reward_ledger (tenant_id, user_id, points, reason, reference)
        VALUES (${tenantId}::uuid, ${userId}::uuid, ${-reward.points_cost}, 'REDEMPTION', ${reward.id})`);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO reward_redemptions (tenant_id, user_id, reward_id, points, status)
        VALUES (${tenantId}::uuid, ${userId}::uuid, ${reward.id}::uuid, ${reward.points_cost}, 'PENDING')`);
      if (reward.stock !== null) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE rewards SET stock = stock - 1, updated_at = NOW()
          WHERE id = ${reward.id}::uuid AND tenant_id = ${tenantId}::uuid`);
      }
      return { redeemed: true, reward: reward.name, points: reward.points_cost, balance: balance - reward.points_cost };
    });
  }

  async adminList(tenantId: string) {
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT id, name, description, points_cost, stock, is_active, created_at, updated_at
      FROM rewards WHERE tenant_id = ${tenantId}::uuid ORDER BY created_at DESC`);
  }

  async adminCreate(tenantId: string, input: { name: string; description?: string; pointsCost: number; stock?: number | null }) {
    if (!input.name?.trim() || !Number.isInteger(input.pointsCost) || input.pointsCost <= 0) {
      throw new BadRequestException('name and positive integer pointsCost are required');
    }
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO rewards (tenant_id, name, description, points_cost, stock)
      VALUES (${tenantId}::uuid, ${input.name.trim().slice(0, 160)}, ${input.description?.trim().slice(0, 500) ?? null}, ${input.pointsCost}, ${input.stock ?? null})
      RETURNING id, name, description, points_cost, stock, is_active, created_at, updated_at`);
    return rows[0];
  }

  async adminSetActive(tenantId: string, rewardId: string, active: boolean) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE rewards SET is_active = ${active}, updated_at = NOW()
      WHERE id = ${rewardId}::uuid AND tenant_id = ${tenantId}::uuid
      RETURNING id, name, description, points_cost, stock, is_active, updated_at`);
    if (!rows[0]) throw new NotFoundException('Reward not found');
    return rows[0];
  }

  async adminAward(tenantId: string, userId: string, points: number, reason: string) {
    if (!Number.isInteger(points) || points <= 0) throw new BadRequestException('points must be a positive integer');
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO reward_accounts (tenant_id, user_id, balance, lifetime_earned, lifetime_redeemed)
        VALUES (${tenantId}::uuid, ${userId}::uuid, 0, 0, 0)
        ON CONFLICT (tenant_id, user_id) DO NOTHING`);
      const rows = await tx.$queryRaw<Array<{ balance: number }>>(Prisma.sql`
        UPDATE reward_accounts SET balance = balance + ${points}, lifetime_earned = lifetime_earned + ${points}, updated_at = NOW()
        WHERE tenant_id = ${tenantId}::uuid AND user_id = ${userId}::uuid
        RETURNING balance`);
      if (!rows[0]) throw new NotFoundException('User is not a member of this club');
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO reward_ledger (tenant_id, user_id, points, reason)
        VALUES (${tenantId}::uuid, ${userId}::uuid, ${points}, ${reason.trim().slice(0, 160)})`);
      return { awarded: points, balance: rows[0].balance };
    });
  }
}
