export interface LoginProvider {
  init(): this;

  signIn?<P>(params: P): Promise<void>;

  signOut?(): Promise<void>
}
