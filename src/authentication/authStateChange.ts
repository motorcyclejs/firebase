import { Stream, Sink, Scheduler } from 'most';
import { Authentication } from './types';

export function authStateChange(firebaseInstance: any) {
  return new Stream<Authentication>(new AuthStateChange(firebaseInstance));
}

class AuthStateChange {
  private auth: firebase.auth.Auth;

  constructor (firebaseInstance: any) {
    this.auth = firebaseInstance.auth();
  }

  public run (sink: Sink<Authentication>, scheduler: Scheduler) {
    const dispose = this.auth.onAuthStateChanged(function (user: firebase.User) {
      sink.event(scheduler.now(), { error: null, user });
    });

    return { dispose };
  }
}
