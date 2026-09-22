import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

export interface FirebaseCredentials {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseAdmin: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    this.firebaseAdmin = this.initializeFirebase();
  }

  private initializeFirebase(): admin.app.App {
    // Priority 1: Service account JSON file (for local dev / staging)
    const credentialsPath = path.join(
      process.cwd(),
      'whatsclone-5c6d0-firebase-adminsdk-fbsvc-74c7139076.json',
    );

    if (fs.existsSync(credentialsPath)) {
      try {
        const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
        const credentials = JSON.parse(credentialsFile);
        this.logger.log('Firebase initialized from service account JSON file');
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: credentials.project_id,
            privateKey: credentials.private_key,
            clientEmail: credentials.client_email,
          }),
        });
      } catch (error: any) {
        this.logger.error(
          `Failed to load Firebase credentials from file: ${error.message}`,
        );
      }
    }

    // Priority 2: Environment variables (production / secure deployment)
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (projectId && privateKey && clientEmail) {
      this.logger.log('Firebase initialized from environment variables');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }

    // Priority 3: Application Default Credentials (GCP environment)
    this.logger.log('Firebase initialized with Application Default Credentials');
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  onModuleInit() {
    this.logger.log('Firebase Admin SDK initialized successfully');
  }

  getApp(): admin.app.App {
    return this.firebaseAdmin;
  }

  getMessaging(): admin.messaging.Messaging {
    return this.firebaseAdmin.messaging();
  }
}