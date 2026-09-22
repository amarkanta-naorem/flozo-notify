import { z } from 'zod';

export const RegisterDeviceTokenSchema = z.object({
  userId: z.number().int().positive(),
  token: z.string().min(1).max(512),
  platform: z.string().max(20).optional(),
});

export type RegisterDeviceTokenDto = z.infer<typeof RegisterDeviceTokenSchema>;

export const UpdateDeviceTokenSchema = z.object({
  token: z.string().min(1).max(512),
  platform: z.string().max(20).optional(),
});

export type UpdateDeviceTokenDto = z.infer<typeof UpdateDeviceTokenSchema>;

export const DeactivateDeviceTokenSchema = z.object({
  token: z.string().min(1).max(512),
});

export type DeactivateDeviceTokenDto = z.infer<typeof DeactivateDeviceTokenSchema>;