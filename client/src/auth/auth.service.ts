import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  User,
  linkWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export const signUp = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await sendEmailVerification(cred.user);
  return cred.user;
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const logout = () => signOut(auth);

export const getIdToken = async () => {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
};

export const linkEmailPasswordToGoogle = async (email: string, password: string) => {
  const user: User | null = auth.currentUser;
  if (!user) throw new Error("No user is signed in to link credentials");

  try {
    const credential = EmailAuthProvider.credential(email, password);
    const linkedUserCredential = await linkWithCredential(user, credential);
    return linkedUserCredential.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === "auth/credential-already-in-use") {
      throw new Error("This email is already linked with another account.");
    }
    throw err;
  }
};