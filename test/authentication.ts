import * as assert from 'assert';
import {
  CREATE_USER, AuthenticationType,
  ANONYMOUSLY, EMAIL_AND_PASSWORD, POPUP, REDIRECT, SIGN_OUT, GET_REDIRECT_RESULT,
} from '../src/authentication/types';
import {
  makeFirebaseAuthenticationDriver,
} from '../src/authentication/makeFirebaseAuthenticationDriver';
import { authStateChange } from '../src/authentication/authStateChange';
import firebase = require('firebase');
import { just, periodic, never } from 'most';

import { MockFirebase } from './helpers/MockFirebase';
import { mockStream } from './helpers/MockStream';

const firebaseConfig = {
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
};

if (!firebase.app) {
  firebase.initializeApp(firebaseConfig);
}

const anonymouslyAuthenticationInput = {
  method: ANONYMOUSLY,
};

const emailAndPasswordAuthenticationInput = {
  method: EMAIL_AND_PASSWORD,
  email: 'sparkstestuser@sparks.network',
  password: 'testpassword',
};

const popupAuthenticationInput = {
  method: POPUP,
  provider: new firebase.auth.GoogleAuthProvider() as firebase.auth.AuthProvider,
};

const redirectAuthenticationInput = {
  method: REDIRECT,
  provider: new firebase.auth.GoogleAuthProvider() as firebase.auth.AuthProvider,
};

const getRedirectResultAuthenticationInput = {
  method: GET_REDIRECT_RESULT,
};

const signOutAuthenticationInput = {
  method: SIGN_OUT,
};

const createUserAuthenticationInput = {
  method: CREATE_USER,
  email: 'newuser@sparks.network',
  password: '1234',
};

describe('firebase authentication', () => {
  let mockFirebase = new MockFirebase(emailAndPasswordAuthenticationInput.email);
  let firebaseAuthenticationDriver =
    makeFirebaseAuthenticationDriver(mockFirebase);

  beforeEach(() => {
    mockFirebase = new MockFirebase(emailAndPasswordAuthenticationInput.email);
    firebaseAuthenticationDriver = makeFirebaseAuthenticationDriver(mockFirebase);
  });

  describe('makeFirebaseAuthenticationDriver', () => {
    it('should be a function', () => {
      assert.ok(typeof makeFirebaseAuthenticationDriver === 'function');
    });
  });

  describe('firebaseAuthenticationDriver', () => {
    it('should be a function', () => {
      assert.ok(typeof firebaseAuthenticationDriver === 'function');
    });

    it('should return a Stream', () => {
      const source = firebaseAuthenticationDriver(just(anonymouslyAuthenticationInput));

      assert.ok(typeof source.observe === 'function');
    });

    it('should already have a listener', (done) => {
      const { stream, callCount } = mockStream<AuthenticationType>();

      firebaseAuthenticationDriver(stream);

      setTimeout(() => {
        assert.ok(callCount() > 0);
        done();
      }, 100);
    });

    describe('source', () => {
      it('should start with an intitial AuthenticationOutput', (done) => {
        const source =
          firebaseAuthenticationDriver(just(emailAndPasswordAuthenticationInput)).take(1);

        source.observe((authenticationOutput) => {
          assert.ok(authenticationOutput.error === null);
          assert.ok(authenticationOutput.user === null);
          done();
        }).catch(done);
      });

      it('should contain an AuthenticationOutput', (done) => {
        firebaseAuthenticationDriver(just(anonymouslyAuthenticationInput)).skip(1)
          .observe((authenticationOutput) => {
            assert.ok(authenticationOutput.hasOwnProperty('error'));
            assert.ok(authenticationOutput.hasOwnProperty('user'));
            done();
          });
      });

      describe('AuthenticationOutput', () => {
        describe('Not Authenticated', () => {
          it('should have property user equal to `null`', (done) => {
            firebaseAuthenticationDriver(just(anonymouslyAuthenticationInput)).take(1)
              .observe(authenticationOutput => {
                assert.ok(authenticationOutput.user === null);
                done();
              });
          });
        });

        describe('Authenticated', () => {
          it('should have property user of type firebase.User', (done) => {
            firebaseAuthenticationDriver(just(emailAndPasswordAuthenticationInput)).skip(1)
              .observe(authenticationOutput => {
                const user: firebase.User | null = authenticationOutput.user;
                assert.ok(user !== null);
                done();
              }).catch(done);
          });
        });
      });
    });

    describe('Sign In', () => {
      describe('Email & Password', () => {
        it('should return a non-null firebase User', (done) => {
          firebaseAuthenticationDriver(just(emailAndPasswordAuthenticationInput)).skip(1)
            .observe(authenticationOutput => {
              const user: firebase.User | null = authenticationOutput.user;

              if (user === null) {
                return done(new Error('User can not be null'));
              }

              assert.ok(user.email === emailAndPasswordAuthenticationInput.email);
              done();
            });
        });

        it('should throw Authentication Errors',
          assertError(emailAndPasswordAuthenticationInput));
      });

      describe('Popup', () => {
        it('should return a non-null firebase User', (done) => {
          firebaseAuthenticationDriver(just(popupAuthenticationInput)).skip(1)
            .observe(authenticationOutput => {
              const user: firebase.User | null = authenticationOutput.user;

              if (user === null) {
                return done(new Error('User can not be null'));
              }

              assert.ok(user.email === emailAndPasswordAuthenticationInput.email);
              done();
            });
        });

        it('should throw Authentication Errors',
          assertError(popupAuthenticationInput));
      });

      describe('Redirect', () => {
        it('should return null firebase User', (done) => {
          firebaseAuthenticationDriver(just(redirectAuthenticationInput)).skip(1)
            .observe(authenticationOutput => {
              const user: firebase.User | null = authenticationOutput.user;

              assert.ok(user === null);
              done();
            });
        });

        it('should throw Authentication Errors',
          assertError(redirectAuthenticationInput));
      });
    });

    describe('Anonymously', () => {
      it('should return a non-null firebase User', (done) => {
        firebaseAuthenticationDriver(just(anonymouslyAuthenticationInput)).skip(1)
          .observe(authenticationOutput => {
            const user: firebase.User | null = authenticationOutput.user;

            if (user === null) {
              return done(new Error('User can not be null'));
            }

            assert.ok(user.isAnonymous);
            done();
          });
      });

      it('should throw Authentication Errors',
        assertError(anonymouslyAuthenticationInput));
    });
  });

  describe('Sign Out', () => {
    it('should return a null firebase User', (done) => {
      const input = [
        anonymouslyAuthenticationInput,
        signOutAuthenticationInput,
      ];

      const authenticationInput$ = periodic(100, 1)
        .skip(1)
        .scan(x => x + 1, 0)
        .map(x => input[x])
        .take(2);

      firebaseAuthenticationDriver(authenticationInput$).skip(2)
        .observe(authenticationOutput => {
          const user: firebase.User | null = authenticationOutput.user;

          assert.ok(user === null);
          done();
        });
    });

    it('should throw Authentication Errors',
      assertError(signOutAuthenticationInput));
  });

  describe('Create Email And Password Account', () => {
    it('should return a non-null firebase User', (done) => {
      firebaseAuthenticationDriver(just(createUserAuthenticationInput)).skip(1)
        .observe(authenticationOutput => {
          const user: firebase.User | null = authenticationOutput.user;

          assert.ok(user !== null);
          done();
        });
    });

    it('should throw Authentication Errors',
      assertError(createUserAuthenticationInput));
  });

  describe('Get Redirect Result', () => {
    describe('No redirect operation called', () => {
      it('should return a null User', (done) => {
        firebaseAuthenticationDriver(just(getRedirectResultAuthenticationInput)).skip(1)
          .observe(authenticationOutput => {
            const user: firebase.User | null = authenticationOutput.user;
            assert.ok(user === null);
            done();
          });
      });
    });

    describe('Signed In', () => {
      it('should return non-null User', (done) => {
        const authenticationInputs = [
          redirectAuthenticationInput,
          getRedirectResultAuthenticationInput,
        ];

        const authenticationInput$ = periodic(100, 1)
          .skip(1)
          .scan(x => x + 1, 0)
          .map(x => authenticationInputs[x])
          .take(2);

        firebaseAuthenticationDriver(authenticationInput$).skip(2)
          .observe((authenticationOutput) => {
            const user: firebase.User | null = authenticationOutput.user;

            if (user === null) {
              return done(new Error('User must not be null'));
            }

            assert.ok(user.email === emailAndPasswordAuthenticationInput.email);
            done();
          });
      });

      it('should handle errors',
        assertError(getRedirectResultAuthenticationInput));
    });
  });

  describe('authStateChange', () => {
    it('emits on authentication state changes', (done) => {
      const user: firebase.User = {} as firebase.User;
      const auth = mockFirebase.auth();

      const authentication$ = authStateChange(mockFirebase);

      setTimeout(() => {
        auth.emitAuthStateChange(user);
      });

      authentication$
        .observe(authentication => {
          assert.strictEqual(authentication.error, null);
          assert.strictEqual(authentication.user, user);
          done();
        })
        .catch(done);
    });
  });
});

function assertError(authenticationInput: AuthenticationType) {
  const code = 'SomeError';
  const driver = makeAuthenticationDriverWithError(code);

  return function (done: any) {
    driver(just(authenticationInput)).skip(1)
      .observe(({ error }) => {
        assert.strictEqual((error as any).code, code);
        done();
      }).catch(done);
  };
};

function makeAuthenticationDriverWithError(error: string) {
  return makeFirebaseAuthenticationDriver(new MockFirebase(
    'test@sparks.network',
    error,
  ));
}
