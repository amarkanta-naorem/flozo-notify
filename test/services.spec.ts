import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin before any imports
const mockSend = vi.fn().mockResolvedValue('mock-message-id');
const mockSendEachForMulticast = vi.fn().mockResolvedValue({
  successCount: 2,
  failureCount: 0,
  responses: [
    { success: true, messageId: 'mock-message-id-1' },
    { success: true, messageId: 'mock-message-id-2' },
  ],
});
const mockMessaging = vi.fn(() => ({
  send: mockSend,
  sendEachForMulticast: mockSendEachForMulticast,
}));
const mockApp = vi.fn(() => ({ messaging: mockMessaging }));
const mockInitializeApp = vi.fn(() => mockApp());
const mockCert = vi.fn();

vi.mock('firebase-admin', () => ({
  initializeApp: mockInitializeApp,
  credential: { cert: mockCert },
  app: { App: mockApp },
  messaging: { Messaging: mockMessaging },
}));

// Mock the database module (path is relative to test file location)
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
  returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  set: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

vi.mock('../src/db/database', () => ({
  db: mockDb,
}));

// Dynamic imports after mocks
const { FcmService } = await import('../src/firebase/services/fcm.service');
const { FirebaseAdminService } = await import('../src/firebase/firebase-admin.service');
const { DeviceTokenService } = await import('../src/notifications/services/device-token.service');

describe('FcmService', () => {
  let fcmService: InstanceType<typeof FcmService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue('mock-message-id');
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [
        { success: true, messageId: 'mock-message-id-1' },
        { success: true, messageId: 'mock-message-id-2' },
      ],
    });
    const firebaseAdminService = new FirebaseAdminService({} as any);
    fcmService = new FcmService(firebaseAdminService);
  });

  it('should send a notification to a single device token', async () => {
    const result = await fcmService.sendNotification('test-token', {
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe('mock-message-id');
  });

  it('should send notifications to multiple devices', async () => {
    const result = await fcmService.sendToMultipleDevices(
      ['token1', 'token2'],
      { title: 'Test', body: 'Test body' },
    );

    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.failedTokens).toEqual([]);
  });

  it('should send a notification to a topic', async () => {
    const result = await fcmService.sendToTopic(
      'general',
      { title: 'Test', body: 'Test body' },
    );

    expect(result).toBe('mock-message-id');
  });
});

describe('DeviceTokenService', () => {
  let service: InstanceType<typeof DeviceTokenService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.where.mockReset();
    mockDb.returning.mockReset();
    service = new DeviceTokenService(mockDb as any);
  });

  it('should register a new device token', async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockDb.returning.mockResolvedValueOnce([{ id: 1 }]);

    const result = await service.registerDeviceToken(1, 'new-token', 'android');

    expect(result.id).toBe(1);
    expect(result.created).toBe(true);
  });

  it('should update an existing device token', async () => {
    mockDb.where.mockResolvedValueOnce([{ id: 1, token: 'existing-token' }]);

    const result = await service.registerDeviceToken(1, 'existing-token', 'ios');

    expect(result.id).toBe(1);
    expect(result.created).toBe(false);
  });

  it('should deactivate a device token', async () => {
    mockDb.where.mockResolvedValueOnce([{ id: 1, token: 'test-token' }]);

    const result = await service.deactivateDeviceToken('test-token');

    expect(result).toBe(true);
  });

  it('should return false when deactivating a non-existent token', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const result = await service.deactivateDeviceToken('non-existent');

    expect(result).toBe(false);
  });
});