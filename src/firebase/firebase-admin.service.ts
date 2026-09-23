import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { App, initializeApp, cert, applicationDefault } from 'firebase-admin';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

export interface FirebaseCredentials {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

interface ServiceAccountJson {
  project_id: string;
  private_key: string;
  client_email: string;
}

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseAdmin: App;

  constructor(private readonly configService: ConfigService) {
    this.firebaseAdmin = this.initializeFirebase();
  }

  private initializeFirebase(): App {
    // Priority 1: Service account JSON file (for local dev / staging)
    const credentialsPath = path.join(
      process.cwd(),
      'whatsclone-5c6d0-firebase-adminsdk-fbsvc-74c7139076.json',
    );

    if (fs.existsSync(credentialsPath)) {
      try {
        const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
        const credentials = JSON.parse(
          credentialsFile,
        ) as ServiceAccountJson;
        this.logger.log('Firebase initialized from service account JSON file');
        return initializeApp({
          credential: cert({
            projectId: credentials.project_id,
            privateKey: credentials.private_key,
            clientEmail: credentials.client_email,
          }),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to load Firebase credentials from file: ${message}`,
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
      return initializeApp({
        credential: cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }

    // Priority 3: Application Default Credentials (GCP environment)
    this.logger.log('Firebase initialized with Application Default Credentials');
    return initializeApp({
      credential: applicationDefault(),
    });
  }

  onModuleInit() {
    this.logger.log('Firebase Admin SDK initialized successfully');
  }

  getApp(): App {
    return this.firebaseAdmin;
  }

  getMessaging(): Messaging {
    return getMessaging(this.firebaseAdmin);
  }
}