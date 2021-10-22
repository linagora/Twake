import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { CronAPI } from "../../core/platform/services/cron/api";
import WebSocketAPI from "../../core/platform/services/websocket/provider";
import { OnlineServiceAPI } from "./api";
import OnlineJob from "./cron";
import { OnlinePubsubService } from "./pubsub";
import { DISCONNECTED_DELAY } from "./constants";

@Prefix("/internal/services/online/v1")
@Consumes(["webserver", "websocket", "cron", "pubsub"])
export default class OnlineService
  extends TwakeService<OnlineServiceAPI>
  implements OnlineServiceAPI
{
  version = "1";
  name = "online";
  service: OnlineServiceAPI;
  private job: OnlineJob;
  private connected: Map<string, number> = new Map();
  private pubsubService: OnlinePubsubService;

  api(): OnlineServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const websocket = this.context.getProvider<WebSocketAPI>("websocket");
    const cron = this.context.getProvider<CronAPI>("cron");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");

    this.pubsubService = new OnlinePubsubService(pubsub);
    this.job = new OnlineJob(cron, websocket, this);

    await this.pubsubService.init();
    await this.job.init();

    websocket.onUserConnected(event => {
      this.logger.info("User connected", event.user.id);
      // save the last connection date
      this.setOnline([event.user.id]);
      // broadcast to global pubsub so that everyone can publish to websockets
      this.pubsubService.broadcastOnline([event.user.id]);
    });

    websocket.onUserDisconnected(event => {
      this.logger.info("User disconnected", event.user.id);
      this.setOffline([event.user.id]);
    });

    return this;
  }

  public async doStart(): Promise<this> {
    return this;
  }

  async setOnline(userIds: Array<string>): Promise<void> {
    const date = Date.now();
    const uniqueIds = new Set<string>(userIds);
    this.logger.info(`Update last active state for users ${userIds.join(",")}`);

    // TODO REAL DB
    for (const id of uniqueIds) {
      this.connected.set(id, date);
    }
  }

  async setOffline(userIds: Array<string>): Promise<void> {
    const uniqueIds = new Set<string>(userIds);
    this.logger.info(`Update last active state for users ${userIds.join(",")}`);

    for (const id of uniqueIds) {
      this.connected.delete(id);
    }
  }

  async isOnline(userId: string): Promise<boolean> {
    const date = this.connected.get(userId);

    if (!date) {
      return false;
    }

    // let's say that a user is connected when its last connection is < 1 minute
    return Date.now() - date < DISCONNECTED_DELAY;
  }
}
