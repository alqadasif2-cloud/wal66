import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Safe Firebase App singleton
let appInstance: FirebaseApp;
try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('[Firebase] App initialization warning:', e);
  try {
    appInstance = getApps()[0] || initializeApp({
      projectId: 'trustwalletpro',
      appId: '1:0:web:0',
      apiKey: 'AIzaDummyKeyForOfflineSafeInit',
    });
  } catch {
    appInstance = {} as FirebaseApp;
  }
}
export const app = appInstance;

// Safe Firestore initialization
let dbInstance: Firestore;
try {
  dbInstance = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch (e) {
  console.warn('[Firebase] Firestore initialization warning:', e);
  try {
    dbInstance = getFirestore(app);
  } catch {
    dbInstance = {} as Firestore;
  }
}
export const db = dbInstance;

// Safe Auth initialization
let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('[Firebase] Auth initialization warning:', e);
  authInstance = {} as Auth;
}
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}
