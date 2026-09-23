import { Module, Global } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service.js';
import { FcmService } from './services/fcm.service.js';

@Global()
@Module({
  providers: [FirebaseAdminService, FcmService],
  exports: [FirebaseAdminService, FcmService],
})
export class FirebaseModule {}