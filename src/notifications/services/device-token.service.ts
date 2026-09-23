import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { deviceTokens } from '../../db/schema/device-tokens.js';

@Injectable()
export class DeviceTokenService {
  private readonly logger = new Logger(DeviceTokenService.name);

  constructor(
    @Inject('DB') private db: PostgresJsDatabase<typeof schema>,
  ) {}

  /**
   * Register a new device token for a user.
   * If the token already exists, updates the user, platform, and active status.
   */
  async registerDeviceToken(
    userId: number,
    token: string,
    platform?: string,
  ): Promise<{ id: number; created: boolean }> {
    // Check if token already exists
    const [existing] = await this.db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token));

    if (existing) {
      // Update existing token
      await this.db
        .update(deviceTokens)
        .set({
          userId,
          platform: platform ?? existing.platform,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(deviceTokens.id, existing.id));

      this.logger.log(
        `Device token updated for user ${userId} (token id: ${existing.id})`,
      );
      return { id: existing.id, created: false };
    }

    // Insert new token
    const [inserted] = await this.db
      .insert(deviceTokens)
      .values({
        userId,
        token,
        platform,
        isActive: true,
      })
      .returning();

    this.logger.log(
      `Device token registered for user ${userId} (token id: ${inserted.id})`,
    );
    return { id: inserted.id, created: true };
  }

  /**
   * Deactivate a device token.
   */
  async deactivateDeviceToken(token: string): Promise<boolean> {
    const [existing] = await this.db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, token));

    if (!existing) {
      return false;
    }

    await this.db
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.id, existing.id));

    this.logger.log(`Device token deactivated (token id: ${existing.id})`);
    return true;
  }

  /**
   * Get all active device tokens for a user.
   */
  async getActiveTokensForUser(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({ token: deviceTokens.token })
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.isActive, true),
        ),
      );

    return rows.map((r) => r.token);
  }

  /**
   * Get all active device token records for a user (with ids and platforms).
   */
  async getActiveTokensWithDetails(userId: number) {
    return this.db
      .select()
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.isActive, true),
        ),
      );
  }

  /**
   * Mark a token as inactive (called when Firebase reports invalid token).
   */
  async markTokenInactive(token: string): Promise<void> {
    await this.db
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.token, token));
  }
}