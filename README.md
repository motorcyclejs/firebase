# @motorcycle/firebase

> Firebase drivers for Motorcycle.js

This is a collection of drivers for interacting with Firebase. Currently only
Firebase Authentication has been implemented, but more will be made in the future.

## Let me have it!
```sh
npm install --save @motorcycle/firebase
```

## Drivers

- [x] Firebase Authentication Driver
- [ ] Firebase Database Driver
- [ ] Firebase Queue Driver
- [ ] Firebase Storage Driver

## API

#### `makeFirebaseAuthenticationDriver(firebase: FirebaseInstance): FirebaseDriver`

```typescript
import { run } from '@motorcycle/core'
import { makeFirebaseAuthenticationDriver } from '@motorcycle/firebase'
import * as firebase from 'firebase';

run(main, {
  authentication$: makeFirebaseAuthenticationDriver(firebase);
});
```

## Types

#### `FirebaseDriver :: (sink$: Stream<AuthenticationType>) => Stream<Authentication>`

```typescript
import { REDIRECT } from '@motorcycle/firebase';

function main (sources) {
  const user$ = sources.authentication$.map(authentication =>
    authentication.userCredential.user);

  return {
    authentication$: sources.DOM.select('#auth').events('click').constant(GoogleAuth)
  }
}

const GoogleAuth = { method: REDIRECT, provider: new firebase.auth.GoogleProvider() }
```

#### `Authentication`

```typescript
export type Authentication = {
  error: AuthenticationError | null;
  userCredential: firebase.auth.UserCredential;
};
```

#### `AuthenticationError`

Extends built-in error type with extra property `code` which represents a
firebase error code.

#### `AuthenticationType`

Dealing with these strings for each `method` is a pain, and easily
open for common typos constants are provided to help you with this. Their
imports are shown with each authentication type.

```typescript
export type AuthenticationType =
  AnonymousAuthentication |
  EmailAndPasswordAuthentication |
  PopupAuthentication |
  RedirectAuthentication |
  SignOutAuthentication |
  CreateUserAuthentication |
  GetRedirectResultAuthentication;

import { ANONYMOUSLY } from '@motorcycle/firebase';

export interface AnonymousAuthentication {
  method: 'ANONYMOUSLY';
}

import { EMAIL_AND_PASSWORD } from '@motorcycle/firebase';

export interface EmailAndPasswordAuthentication {
  method: 'EMAIL_AND_PASSWORD';
  email: string;
  password: string;
}

import { POPUP } from '@motorcycle/firebase';

export interface PopupAuthentication {
  method: 'POPUP';
  provider: firebase.auth.AuthProvider;
}

import { REDIRECT } from '@motorcycle/firebase';

export interface RedirectAuthentication {
  method: 'REDIRECT';
  provider: firebase.auth.AuthProvider;
}

import { SIGN_OUT } from '@motorcycle/firebase';

export interface SignOutAuthentication {
  method: 'SIGN_OUT';
}

import { CREATE_USER } from '@motorcycle/firebase';

export interface CreateUserAuthentication {
  method: 'CREATE_USER';
  email: string;
  password: string;
}

import { GET_REDIRECT_RESULT } from '@motorcycle/firebase';

export interface GetRedirectResultAuthentication {
  method: 'GET_REDIRECT_RESULT';
}
```