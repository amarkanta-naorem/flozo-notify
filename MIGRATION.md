# Push Notification Service Migration Guide

## Overview
This document describes the migration of Push Notification functionality from `messaging_app` to `flozo-notify`.

## Architecture
```
messaging_app (port 3000)
    |
    | BullMQ Producer
    v
Redis (notifications queue)
    |
    | BullMQ Worker
    v
flozo-notify (port 5005)
    |
    | Firebase Admin SDK
    v
Firebase FCM
    |
    v
User Devices
```

## Prerequisites
- PostgreSQL running (shared database)
- Redis running
- Node.js 20+ installed in both projects
- npm packages installed in both projects

## Step 1: Run Database Migrations

### flozo-notify
```bash
cd flozo-notify
npm run db:migrate
```
This creates the `device_tokens`, `notifications`, and `notification_logs` tables.

### messaging_app (optional, after data migration)
```bash
cd messaging_app
npm run db:migrate
```
This removes the `fcm_tokens` column from the `users` table.

## Step 2: Migrate Existing FCM Tokens

Run the data migration script to move existing tokens from `users.fcm_tokens` to `device_tokens`:
```bash
cd flozo-notify
npx tsx scripts/migrate-fcm-tokens.ts
```

## Step 3: Start Services

### Start flozo-notify
```bash
cd flozo-notify
npm run start:dev
```
Service runs on port 5005.

### Start messaging_app
```bash
cd messaging_app
npm run start:dev
```
Service runs on port 3000.

## Step 4: Verify Notification Flow

1. Register a device token:
```bash
curl -X POST http://localhost:5005/api/device-tokens \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "token": "test-token", "platform": "android"}'
```

2. Send a message in messaging_app (triggers notification job automatically):
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"receiverPhone": "+1234567890", "content": {"type": "text", "text": "Hello"}}'
```

3. Check queue health:
```bash
curl http://localhost:5005/api/queue/health
```

4. Check service health:
```bash
curl http://localhost:5005/api/health
```

## API Endpoints

### flozo-notify (Port 5005)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/device-tokens | Register/update device token |
| PUT | /api/device-tokens | Update device token |
| DELETE | /api/device-tokens | Deactivate device token |
| POST | /api/notifications/send-to-user | Enqueue notification for user |
| POST | /api/notifications/send-to-users | Enqueue notification for multiple users |
| POST | /api/notifications/send-to-token | Enqueue notification for specific token |
| POST | /api/notifications/send-to-topic | Enqueue notification for topic |
| GET | /api/queue/health | Queue statistics |
| GET | /api/health | Service health |

### messaging_app (Port 3000)
All business APIs remain unchanged except:
- `POST /users/fcm-tokens` → REMOVED (moved to flozo-notify)
- `DELETE /users/fcm-tokens` → REMOVED (moved to flozo-notify)

## Environment Variables

### flozo-notify
| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| REDIS_HOST | Yes | Redis host |
| REDIS_PORT | Yes | Redis port |
| REDIS_PASSWORD | Yes | Redis password |
| JWT_ACCESS_SECRET | Yes | Shared JWT secret (same as messaging_app) |
| PORT | No | Service port (default: 5005) |
| FIREBASE_PROJECT_ID | No | Firebase project ID (for production) |
| FIREBASE_CLIENT_EMAIL | No | Firebase client email |
| FIREBASE_PRIVATE_KEY | No | Firebase private key |

### messaging_app
| Variable | Required | Description |
|----------|----------|-------------|
| REDIS_HOST | Yes | Redis host |
| REDIS_PORT | Yes | Redis port |
| REDIS_PASSWORD | Yes | Redis password |
| (other existing vars) | | Unchanged |

## Testing

### Unit Tests
```bash
cd flozo-notify
npm test
```

### Integration Tests
```bash
cd flozo-notify
npm run test:e2e
```

## Monitoring

### Queue Statistics
```bash
curl http://localhost:5005/api/queue/stats
```
Returns:
```json
{
  "success": true,
  "queues": [{
    "queue": "notifications",
    "waiting": 0,
    "active": 0,
    "completed": 100,
    "failed": 0,
    "delayed": 0,
    "paused": false
  }],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rollback Plan

If migration issues occur:
1. Stop flozo-notify
2. Restore messaging_app from backup
3. Revert package.json to original state
4. Restore Firebase module in messaging_app

## Troubleshooting

### "Queue not responding"
Check Redis connection in flozo-verify `.env`:
```bash
redis-cli -u redis://default:PASSWORD@HOST:PORT
```

### "Firebase initialization failed"
Verify Firebase credentials:
- Local: Check JSON file exists at project root
- Production: Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

### "Device token not found"
Run data migration script:
```bash
cd flozo-notify
npx tsx scripts/migrate-fcm-tokens.ts
```