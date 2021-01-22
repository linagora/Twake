import { Consumes, TwakeService, logger } from "../../framework";
import TrackerAPI from "./provider";
import { trackedEventBus } from "../../framework/pubsub";
import {
  TrackerEventActions,
  TrackerDataListener,
  IdentifyObjectType,
  TrackedEventType,
} from "./types";
import Analytics from "analytics-node";

@Consumes([])
export default class Tracker extends TwakeService<TrackerAPI> implements TrackerAPI {
  name = "tracker";
  version = "1";
  analytics: Analytics;

  async doInit(): Promise<this> {
    trackedEventBus.subscribe<TrackerDataListener>(TrackerEventActions.TWAKE_OPEN_CLIENT, data => {
      this.identify({
        userId: data.user.id,
      });
      this.track(
        {
          userId: data.user.id,
          event: TrackerEventActions.TWAKE_OPEN_CLIENT,
        },
        (err: Error) => (err ? logger.error("Error while tracking -->", err) : false),
      );
    });
    trackedEventBus.subscribe<TrackerDataListener>(
      TrackerEventActions.TWAKE_CHANNEL_MESSAGE_SENT,
      data => {
        this.track(
          {
            userId: data.message.sender,
            event: TrackerEventActions.TWAKE_CHANNEL_MESSAGE_SENT,
            properties: {
              is_direct: data.message.workspace_id === "direct" ? true : false,
              is_thread_reply: data.message.thread_id ? true : false,
            },
          },
          (err: Error) => (err ? logger.error("Error while tracking -->", err) : false),
        );
      },
    );
    trackedEventBus.subscribe<TrackerDataListener>(
      TrackerEventActions.TWAKE_CHANNEL_CREATED,
      data => {
        this.track(
          {
            userId: data.channel.owner,
            event: TrackerEventActions.TWAKE_CHANNEL_CREATED,
            properties: this.getVisibilityObject(data.channel.visibility),
          },
          (err: Error) => (err ? logger.error("Error while tracking -->", err) : false),
        );
      },
    );
    trackedEventBus.subscribe<TrackerDataListener>(
      TrackerEventActions.TWAKE_CHANNEL_MEMBER_CREATED,
      data => {
        this.track(
          {
            userId: data.member.user_id,
            event:
              data.user.id !== data.member.user_id
                ? TrackerEventActions.TWAKE_CHANNEL_INVITE
                : TrackerEventActions.TWAKE_CHANNEL_JOIN,
            properties: this.getVisibilityObject(data.channel.visibility),
          },
          (err: Error) => (err ? logger.error("Error while tracking -->", err) : false),
        );
      },
    );

    return this;
  }

  private getVisibilityObject(visibility: string) {
    return {
      is_direct: visibility === "direct" ? true : false,
      is_private: visibility === "private" ? true : false,
      is_public: visibility === "public" ? true : false,
    };
  }

  public async identify(
    identity: IdentifyObjectType,
    callback?: (err: Error) => void,
  ): Promise<Analytics> {
    const analytics = await this.getAnalytics("segment");

    if (analytics && identity) return analytics.identify(identity, callback);
  }

  public async track(
    tracker: TrackedEventType,
    callback?: (err: Error) => void,
  ): Promise<Analytics> {
    const analytics = await this.getAnalytics("segment");

    if (analytics && tracker) return analytics.track(tracker, callback);
  }

  private async getAnalytics(trackerName: string): Promise<Analytics> {
    const trackerKey = this.configuration.get<string>(trackerName, "");

    if (!this.analytics && trackerKey) {
      this.analytics = new Analytics(trackerKey);
    }
    return this.analytics;
  }

  api(): TrackerAPI {
    return this;
  }
}
