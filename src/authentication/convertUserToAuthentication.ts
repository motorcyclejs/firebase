import { Authentication } from './types';

export function convertUserToAuthentication(
  user: firebase.User | null): Authentication
{
  return {
    error: null,
    user,
  };
}
