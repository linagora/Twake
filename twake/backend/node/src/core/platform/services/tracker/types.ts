export type IdentityType =
  | { userId: string | number }
  | { userId?: string | number; anonymousId: string | number };

export type IdentifyObjectType = IdentityType & {
  traits?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};

export type TrackedEventType = IdentityType & {
  // event starts with prefix `twake:`
  event: string;
  properties?: { [key: string]: unknown };
  timestamp?: Date;
  context?: { [key: string]: unknown };
};

export type TrackerConfiguration = {
  key: string;
};
