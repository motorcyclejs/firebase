import { Stream, just } from 'most';
import * as firebase from 'firebase';
import {
  AuthenticationType, CreateUserAuthentication,
  EmailAndPasswordAuthentication, PopupAuthentication,
  REDIRECT, EMAIL_AND_PASSWORD, CREATE_USER, POPUP, ANONYMOUSLY, SIGN_OUT,
  GET_REDIRECT_RESULT,
} from './types';

export function createUser$(
    method: string,
    authenticationType: AuthenticationType,
    firebaseInstance: any): Stream<firebase.User | null>
{
  // Ordered most common on top for optimisation.
  // We use if-statements instead of switch, because few conditionals
  // optimise better with if-statements.
  if (method === GET_REDIRECT_RESULT)
    return getRedirectResult(firebaseInstance);

  if (method === REDIRECT)
    return redirectSignIn(authenticationType, firebaseInstance);

  if (method === EMAIL_AND_PASSWORD)
    return emailAndPasswordSignIn(authenticationType, firebaseInstance);

  if (method === CREATE_USER) {
    const { email, password } = authenticationType as CreateUserAuthentication;

    return fromFirebasePromise<firebase.User>(
      firebaseInstance.auth().createUserWithEmailAndPassword(email, password));
  }

  if (method === POPUP)
    return popupSignIn(authenticationType, firebaseInstance);

  if (method === ANONYMOUSLY)
    return fromFirebasePromise<firebase.User>(
      firebaseInstance.auth().signInAnonymously());

  if (method === SIGN_OUT)
    return fromFirebasePromise<void>(firebaseInstance.auth().signOut())
      .constant(null);

  return just(null);
}

function emailAndPasswordSignIn(authenticationInput: AuthenticationType, firebaseInstance: any) {
  const { email, password } = (authenticationInput as EmailAndPasswordAuthentication);

  return fromFirebasePromise<firebase.User>(
    firebaseInstance.auth().signInWithEmailAndPassword(email, password));
}

function popupSignIn(authenticationInput: AuthenticationType, firebaseInstance: any) {
  const { provider } = authenticationInput as PopupAuthentication;

  return fromFirebasePromise<firebase.User>(
    firebaseInstance.auth().signInWithPopup(provider).then(convertUserCredentialToUser));
}

function redirectSignIn(authenticationInput: AuthenticationType, firebaseInstance: any) {
  const { provider } = authenticationInput as PopupAuthentication;

  return fromFirebasePromise<firebase.User>(
    firebaseInstance.auth().signInWithRedirect(provider)
      .then(convertUserCredentialToUser),
  );
}

function getRedirectResult(firebaseInstance: any) {
  return fromFirebasePromise<firebase.User>(
    firebaseInstance.auth().getRedirectResult()
      .then(convertUserCredentialToUser),
  );
}

function fromFirebasePromise<T>(firebasePromise: firebase.Promise<T>): Stream<T> {
  return just<firebase.Promise<T>>(firebasePromise).await<T>();
}

function convertUserCredentialToUser (
  userCredential: firebase.auth.UserCredential): firebase.User | null
{
  return userCredential.user;
}
