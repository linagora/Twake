import { Consumes, TwakeService } from "../../framework";
import TrackerAPI, { IdentifyObjectType, TrackedEventType } from "./provider";
import Analytics from "analytics-node";

@Consumes([])
export default class Tracker extends TwakeService<TrackerAPI> implements TrackerAPI {
  name = "tracker";
  version = "1";
  analytics: Analytics;

  public async identify(
    identity: IdentifyObjectType,
    callback?: (err: Error) => void,
  ): Promise<Analytics> {
    if ((await this.getAnalytics("segment")) && identity)
      return (await this.getAnalytics("segment")).identify(identity, callback);
  }

  public async track(
    tracker: TrackedEventType,
    callback?: (err: Error) => void,
  ): Promise<Analytics> {
    if ((await this.getAnalytics("segment")) && tracker)
      return (await this.getAnalytics("segment")).track(tracker, callback);
  }

  private async getAnalytics(trackerName: string): Promise<Analytics> {
    const trackerKey = this.configuration.get<string>(trackerName, "");

    if (!this.analytics && trackerKey) {
      this.analytics = new Analytics(trackerKey, {
        flushAt: 20,
        flushInterval: 10000,
      });
    }
    return this.analytics;
  }

  api(): TrackerAPI {
    return this;
  }
}
