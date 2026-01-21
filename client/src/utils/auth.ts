import { auth } from "../auth/firebase"
import { onAuthStateChanged, User } from "firebase/auth"

export function isAuthenticated(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}