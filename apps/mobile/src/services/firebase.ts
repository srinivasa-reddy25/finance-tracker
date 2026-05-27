import {
  getAuth,
  signInWithCredential,
  signOut as firebaseSignOut,
  getIdToken as firebaseGetIdToken,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from '../constants/env';

GoogleSignin.configure({ webClientId: ENV.GOOGLE_WEB_CLIENT_ID });

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const idToken = data?.idToken;
  if (!idToken) throw new Error('No ID token from Google');
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(getAuth(), credential);
};

export const getIdToken = async (): Promise<string | null> => {
  const user = getAuth().currentUser;
  if (!user) return null;
  return firebaseGetIdToken(user);
};

export const signOut = async () => {
  await GoogleSignin.signOut();
  await firebaseSignOut(getAuth());
};
