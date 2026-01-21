// plugins/firebase.ts
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount: Record<string, unknown> = {
  projectId: process.env.project_id,
  privateKey: process.env.private_key ? process.env.private_key.replace(/\\n/g, '\n') : undefined,
  clientEmail: process.env.client_email,
  // preserve other fields in case they are consumed elsewhere
  type: process.env.type,
  private_key_id: process.env.private_key_id,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;