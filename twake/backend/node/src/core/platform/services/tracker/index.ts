import Analytics from "analytics-node";
import { Consumes, TwakeService, logger } from "../../framework";
import TrackerAPI from "./provider";
import { localEventBus } from "../../framework/pubsub";
import { IdentifyObjectType, TrackedEventType, TrackerConfiguration } from "./types";
import { ResourceEventsPayload } from "../../../../utils/types";

@Consumes([])
export default class Tracker extends TwakeService<TrackerAPI> implements TrackerAPI {
  name = "tracker";
  version = "1";
  analytics: Analytics;

  async doInit(): Promise<this> {
    const channelListEvent = "channel:list";
    localEventBus.subscribe<ResourceEventsPayload>(channelListEvent, data => {
      logger.debug(`Tracker - New ${channelListEvent} event`);
      this.identify({
        user: data.user,
        traits: {
          email: data.user.email || "",
          company: {
            id: data.company.id,
          },
          companies: [data.company.id],
        },
      });
      this.track(
        {
          user: data.user,
          event: "open_client",
        },
        (err: Error) =>
          err
            ? logger.error({ err }, "Tracker - Error while tracking event", channelListEvent)
            : false,
      );
    });

    const messageSentEvent = "channel:message_sent";
    localEventBus.subscribe<ResourceEventsPayload>(messageSentEvent, data => {
      logger.debug(`Tracker - New ${messageSentEvent} event`);
      this.track(
        {
          user: data.user,
          event: messageSentEvent,
          properties: {
            is_direct: data.message.workspace_id === "direct" ? true : false,
            is_thread_reply: data.message.thread_id ? true : false,
          },
        },
        (err: Error) =>
          err ? logger.error({ err }, "Tracker - Error while tracking", messageSentEvent) : false,
      );
    });

    const channelCreatedEvent = "channel:created";
    localEventBus.subscribe<ResourceEventsPayload>(channelCreatedEvent, data => {
      logger.debug(`Tracker - New ${channelCreatedEvent} event`);
      this.track(
        {
          user: data.user,
          event: channelCreatedEvent,
          properties: this.getVisibilityObject(data.channel.visibility),
        },
        (err: Error) =>
          err
            ? logger.error({ err }, "Tracker - Error while tracking", channelCreatedEvent)
            : false,
      );
    });

    const channelMemberCreatedEvent = "channel:member:created";
    localEventBus.subscribe<ResourceEventsPayload>(channelMemberCreatedEvent, data => {
      logger.debug(`Tracker - New ${channelMemberCreatedEvent} event`);
      this.track(
        {
          user: data.user,
          event: data.user.id !== data.member.user_id ? "channel:invite" : "channel:join",
          properties: this.getVisibilityObject(data.channel.visibility),
        },
        (err: Error) =>
          err
            ? logger.error({ err }, "Tracker - Error while tracking", channelMemberCreatedEvent)
            : false,
      );
    });

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
    const analiticsIdentity = {
      userId: identity.user?.allow_tracking ? identity.user.identity_provider_id : undefined,
      anonymousId: "anonymous",
      ...identity,
    };

    const analytics = await this.getAnalytics();

    if (analytics && identity) return analytics.identify(analiticsIdentity, callback);
  }

  public async track(event: TrackedEventType, callback?: (err: Error) => void): Promise<Analytics> {
    if (!event.user) {
      logger.warn(`Tracker - Tried to track event without userId: ${event.event}`);
      return;
    }

    if (!event.user?.allow_tracking) return;

    const analytics = await this.getAnalytics();

    if (analytics && event) {
      event.event = `twake:${event.event}`;
      return analytics.track(
        {
          userId: event.user?.allow_tracking ? event.user.identity_provider_id : undefined,
          anonymousId: "anonymous",
          ...event,
        },
        callback,
      );
    }
  }

  private async getAnalytics(): Promise<Analytics | void> {
    const type = this.configuration.get<string>("type");
    if (!type || !type.length) {
      logger.info("Tracker - No tracker type specified");
      return;
    }

    const config = this.configuration.get<TrackerConfiguration>(type);
    if (!config) {
      logger.info("Tracker - No tracker configured for type", type);
      return;
    }

    if (!this.analytics && config.key) {
      this.analytics = new Analytics(config.key);
    }

    return this.analytics;
  }

  api(): TrackerAPI {
    return this;
  }
}
