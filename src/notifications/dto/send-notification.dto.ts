import { z } from 'zod';

export const SendToUserSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1024),
  data: z.record(z.string(), z.string()).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['high', 'normal']).optional().default('high'),
});

export type SendToUserDto = z.infer<typeof SendToUserSchema>;

export const SendToUsersSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1).max(100),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1024),
  data: z.record(z.string(), z.string()).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['high', 'normal']).optional().default('high'),
});

export type SendToUsersDto = z.infer<typeof SendToUsersSchema>;

export const SendToTokenSchema = z.object({
  token: z.string().min(1).max(512),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1024),
  data: z.record(z.string(), z.string()).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['high', 'normal']).optional().default('high'),
});

export type SendToTokenDto = z.infer<typeof SendToTokenSchema>;

export const SendToTopicSchema = z.object({
  topic: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1024),
  data: z.record(z.string(), z.string()).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['high', 'normal']).optional().default('high'),
});

export type SendToTopicDto = z.infer<typeof SendToTopicSchema>;