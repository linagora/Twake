type AuthEvent = 'userLoaded' | 'userUnloaded' | 'userSignedOut' | 'accessTokenExpiring' | 'accessTokenExpired' | 'silentRenewError';

export type InitParameters = {
  onSessionExpired?: () => void;
}
export interface AuthProvider<SignInParameters, SignOutParameters> {
  init(params?: InitParameters): this;

  signIn?(params: SignInParameters): Promise<void>;

  signOut?(params: SignOutParameters): Promise<void>;

  addEventListener?(event: AuthEvent, listener: (args: any) => {}): void;
}
