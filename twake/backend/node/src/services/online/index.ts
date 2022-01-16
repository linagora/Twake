import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { CronAPI } from "../../core/platform/services/cron/api";
import WebSocketAPI from "../../core/platform/services/websocket/provider";
import Repository from "../../core/platform/services/database/services/orm/repository/repository";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";

import { OnlineGetRequest, OnlineGetResponse, OnlineServiceAPI } from "./api";
import OnlineJob from "./cron";
import { OnlinePubsubService } from "./pubsub";
import { DISCONNECTED_DELAY } from "./constants";
import UserOnline, { TYPE as ONLINE_TYPE, getInstance } from "./entities/user-online";

@Prefix("/internal/services/online/v1")
@Consumes(["webserver", "websocket", "cron", "pubsub", "database"])
export default class OnlineService
  extends TwakeService<OnlineServiceAPI>
  implements OnlineServiceAPI
{
  version = "1";
  name = "online";
  service: OnlineServiceAPI;
  private job: OnlineJob;
  private pubsubService: OnlinePubsubService;
  onlineRepository: Repository<UserOnline>;

  api(): OnlineServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const websocket = this.context.getProvider<WebSocketAPI>("websocket");
    const cron = this.context.getProvider<CronAPI>("cron");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");
    const database = this.context.getProvider<DatabaseServiceAPI>("database");

    this.onlineRepository = await database.getRepository(ONLINE_TYPE, UserOnline);

    this.pubsubService = new OnlinePubsubService(pubsub);
    this.job = new OnlineJob(cron, websocket, this);

    await this.pubsubService.init();
    await this.job.init();

    websocket.onUserConnected(event => {
      this.logger.info("User connected", event.user.id);
      // save the last connection date
      this.setLastSeenOnline([event.user.id], Date.now());
      // broadcast to global pubsub so that everyone can publish to websockets
      this.pubsubService.broadcastOnline([[event.user.id, true]]);

      event.socket.on(
        "online:get",
        async (request: OnlineGetRequest, ack: (response: OnlineGetResponse) => void) => {
          this.logger.debug(`Got an online:get request for ${(request.data || []).length} users`);

          ack({ data: await this.getOnlineStatuses(request.data) });
        },
      );
    });

    websocket.onUserDisconnected(event => {
      this.logger.info("User disconnected", event.user.id);
      // Since the user can be connected on several nodes, we cannot directly set it status to offline
      // We do nothing, the cron will do the job...
    });

    return this;
  }

  private async getOnlineStatuses(ids: Array<string> = []): Promise<Array<[string, boolean]>> {
    return this.areOnline(ids);
  }

  async setLastSeenOnline(userIds: Array<string> = [], date: number): Promise<void> {
    this.logger.debug(`setLastSeenOnline ${userIds.join(",")}`);
    if (!userIds.length) {
      return;
    }
    const last_seen = date || Date.now();
    const uniqueIds = new Set<string>(userIds);
    this.logger.info(`Update last active state for users ${userIds.join(",")}`);
    const onlineUsers: UserOnline[] = Array.from(uniqueIds.values()).map(user_id =>
      getInstance({ user_id, last_seen }),
    );
    await this.onlineRepository.saveAll(onlineUsers);
  }

  async isOnline(userId: string): Promise<boolean> {
    const user = await this.onlineRepository.findOne({ user_id: userId });

    if (!user) {
      return false;
    }

    return Date.now() - user.last_seen < DISCONNECTED_DELAY;
  }

  private async areOnline(ids: Array<string> = []): Promise<Array<[string, boolean]>> {
    const users = await this.onlineRepository.find({}, { $in: [["user_id", ids]] });

    return users.getEntities().map(user => [user.user_id, this.isStillConnected(user.last_seen)]);
  }

  /**
   * let's say that a user is connected when its last connection is more than some delay ago
   */
  private isStillConnected(date: number): boolean {
    return Date.now() - date < DISCONNECTED_DELAY;
  }
}
