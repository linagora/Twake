export type BrowserInformation = {
  name: string;
  version: string | null;
  os: string | null;
};

export type TargetWindow = 'main' | 'popup';

export type WindowMessageType = 'redirected' | 'force_reload';
