import { FastifyRequest, FastifyReply } from 'fastify';
import admin from '../plugins/firebase.js';

export async function firebaseAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.trim().startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1] || '';
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user: { uid: string; email?: string } = { uid: decodedToken.uid };
    if (decodedToken.email !== undefined) {
      user.email = decodedToken.email;
    }
    request.user = user;
  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized: Invalid or expired token' });
  }
}