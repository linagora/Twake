type AuthEvent = 'userLoaded' | 'userUnloaded' | 'userSignedOut' | 'accessTokenExpiring' | 'accessTokenExpired' | 'silentRenewError';

export interface AuthProvider<SignInParameters, SignOutParameters> {
  init(): this;

  signIn?(params: SignInParameters): Promise<void>;

  signOut?(params: SignOutParameters): Promise<void>;

  addEventListener?(event: AuthEvent, listener: (args: any) => {}): void;
}
