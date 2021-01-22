import Analytics from "analytics-node";
import { TwakeServiceProvider } from "../../framework";
import { IdentifyObjectType, TrackedEventType } from "./types";

export default interface TrackerAPI extends TwakeServiceProvider {
  identify(identity: IdentifyObjectType, callback?: (err: Error) => void): Promise<Analytics>;
  track(tracker: TrackedEventType, callback?: (err: Error) => void): Promise<Analytics>;
}
