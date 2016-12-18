import firebase = require('firebase');

function convertUserToUserCredential (provider: firebase.auth.AuthProvider) {
  return function (user: firebase.User) {
    return {
      user,
      credential: { provider },
    };
  };
}

const defaultUserCredential = {
  user: null,
  credential: null,
};

export class MockFirebase {
  private _mockAuth: MockAuth;

  constructor(private email: string, private error = '') {
    this._mockAuth = new MockAuth(this.email, this.error);
  }

  public auth() {
    return this._mockAuth;
  }
}

export class MockAuth {
  public authenticationOccured: boolean = false;
  private authStateListeners: Array<(user: firebase.User) => any> = [];

  constructor(private email: string, private error: string) {}

  public signInAnonymously(): firebase.Promise<firebase.User> {
    return this.checkForError(makeUser('', true));
  }

  public signInWithEmailAndPassword(email: string): firebase.Promise<firebase.User> {
    return this.checkForError(makeUser(email, false));
  }

  public signInWithPopup(provider: firebase.auth.AuthProvider):
    firebase.Promise<firebase.auth.UserCredential>
  {
    return this.checkForError(emailAndPasswordSignIn(this.email, provider));
  }

  public signInWithRedirect(): firebase.Promise<void> {
    return this.checkForError(firebase.Promise.resolve(void 0));
  }

  public getRedirectResult(): firebase.Promise<firebase.auth.UserCredential> {
    const returnValue = this.authenticationOccured
      ? emailAndPasswordSignIn(this.email, new firebase.auth.EmailAuthProvider())
      : firebase.Promise.resolve(defaultUserCredential);

    return this.checkForError(returnValue);
  }

  public signOut(): firebase.Promise<void> {
    return this.checkForError(firebase.Promise.resolve(void 0));
  }

  public createUserWithEmailAndPassword(email: string): firebase.Promise<firebase.User> {
    return this.checkForError(makeUser(email, false));
  }

  public onAuthStateChanged(next: (user: firebase.User) => any): Function {
    this.authStateListeners.push(next);

    return () => {
      this.authStateListeners = this.authStateListeners.filter(x => x !== next);
    };
  }

  public emitAuthStateChange (user: firebase.User) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  private checkForError(returnValue: any) {
    if (this.error) {
      return makeAuthenticationError(
        this.error,
        this.error,
      );
    }

    this.authenticationOccured = true;

    return returnValue;
  }
}

function emailAndPasswordSignIn(email: string, provider: any) {
  return makeUser(email, false).then(convertUserToUserCredential(provider));
}

function makeUser(email: string, isAnonymous: boolean) {
  return firebase.Promise.resolve({ email, isAnonymous } as any as firebase.User);
}

function makeAuthenticationError(code: string, message: string) {
  return firebase.Promise.reject(new MockAuthenticationError( code, message));
}

class MockAuthenticationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
