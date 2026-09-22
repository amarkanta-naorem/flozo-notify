import { z } from 'zod';

export const NotificationJobDataSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1024),
  data: z.record(z.string(), z.string()).optional(),
  type: z.string().max(50).optional(),
  priority: z.enum(['high', 'normal']).optional().default('high'),
});

export type NotificationJobData = z.infer<typeof NotificationJobDataSchema>;

export const SendToUserJobSchema = z.object({
  jobType: z.literal('send-to-user'),
  userId: z.number().int().positive(),
  ...NotificationJobDataSchema.shape,
});

export type SendToUserJob = z.infer<typeof SendToUserJobSchema>;

export const SendToUsersJobSchema = z.object({
  jobType: z.literal('send-to-users'),
  userIds: z.array(z.number().int().positive()).min(1).max(100),
  ...NotificationJobDataSchema.shape,
});

export type SendToUsersJob = z.infer<typeof SendToUsersJobSchema>;

export const SendToTokenJobSchema = z.object({
  jobType: z.literal('send-to-token'),
  token: z.string().min(1).max(512),
  ...NotificationJobDataSchema.shape,
});

export type SendToTokenJob = z.infer<typeof SendToTokenJobSchema>;

export const SendToTopicJobSchema = z.object({
  jobType: z.literal('send-to-topic'),
  topic: z.string().min(1).max(100),
  ...NotificationJobDataSchema.shape,
});

export type SendToTopicJob = z.infer<typeof SendToTopicJobSchema>;

export const NotificationJobSchema = z.discriminatedUnion('jobType', [
  SendToUserJobSchema,
  SendToUsersJobSchema,
  SendToTokenJobSchema,
  SendToTopicJobSchema,
]);

export type NotificationJob = z.infer<typeof NotificationJobSchema>;