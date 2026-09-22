import { Module, Global } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FcmService } from './services/fcm.service';

@Global()
@Module({
  providers: [FirebaseAdminService, FcmService],
  exports: [FirebaseAdminService, FcmService],
})
export class FirebaseModule {}