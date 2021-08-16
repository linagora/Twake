type AuthEvent = 'userLoaded' | 'userUnloaded' | 'userSignedOut' | 'accessTokenExpiring' | 'accessTokenExpired' | 'silentRenewError';

export interface AuthProvider {
  init(): this;

  signIn?<P>(params: P): Promise<void>;

  signOut?(): Promise<void>;

  addEventListener?(event: AuthEvent, listener: (args: any) => {}): void;
}
