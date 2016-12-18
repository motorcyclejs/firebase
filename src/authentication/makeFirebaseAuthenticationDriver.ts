import { Stream, Sink, Scheduler, just } from 'most';
import hold from '@most/hold';
import * as firebase from 'firebase';
import { AuthenticationType, Authentication } from './types';
import { createUser$ } from './createUser$';
import { AuthenticationError } from './AuthenticationError';
import { convertUserToAuthentication } from './convertUserToAuthentication';
import { authStateChange } from './authStateChange';

export function makeFirebaseAuthenticationDriver(firebaseInstance: any) {

  return function firebaseAuthenticationDriver(
    sink$: Stream<AuthenticationType>): Stream<Authentication>
  {
    const authStateChange$ = authStateChange(firebaseInstance);

    const authentication$ = sink$.map((authenticationInput) => {
      const method = authenticationInput.method;

      return createUser$(method, authenticationInput, firebaseInstance)
        .map(convertUserToAuthentication)
        .recoverWith<firebase.auth.Error>(createDefaultAuthenticationOutput$);
    })
      .switch()
      .merge(authStateChange$)
      .startWith(convertUserToAuthentication(null))
      .thru(hold);

    authentication$.drain();

    return authentication$;
  };
}

function createDefaultAuthenticationOutput$(error: firebase.auth.Error) {
  return just<Authentication>({
    error: new AuthenticationError(error.code, error.message),
    user: null,
  });
}
