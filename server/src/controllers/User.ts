import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/User.js';
import UserModel from '../models/User.js';
import { initializeUserSettings } from './UserSettings.js';

export const createUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // console.log("requestt: ", request.body)
    const { uid, email, displayName, photoURL } = request.body as {
      uid: string
      email: string
      displayName: string
      photoURL?: string
    }
    const user = await UserModel.findOneAndUpdate(
      {firebase_user_id: uid},
      {
        $set: {
          name: displayName,
          email,
          img: photoURL,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { new: true, upsert: true }
    )
    
    // Initialize user settings if this is a new user
    if (user) {
      await initializeUserSettings(uid, user._id.toString());
    }
    
    reply.status(200).send(user)
  } catch (err) {
    console.log('error: ', err);
    reply.status(500).send(err);
  }
};