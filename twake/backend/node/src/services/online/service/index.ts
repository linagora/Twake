import Repository from "../../../core/platform/services/database/services/orm/repository/repository";

import { OnlineGetRequest, OnlineGetResponse } from "../types";
import OnlineJob from "../cron";
import { OnlinePubsubService } from "../pubsub";
import { DISCONNECTED_DELAY } from "../constants";
import UserOnline, { getInstance, TYPE as ONLINE_TYPE } from "../entities/user-online";
import gr from "../../global-resolver";
import { getLogger, TwakeLogger, TwakeServiceProvider } from "../../../core/platform/framework";
import { ExecutionContext } from "../../../core/platform/framework/api/crud-service";

export default class OnlineServiceImpl implements TwakeServiceProvider {
  version = "1";
  service: OnlineServiceImpl;
  private job: OnlineJob;
  private pubsubService: OnlinePubsubService;
  onlineRepository: Repository<UserOnline>;
  private logger: TwakeLogger;

  constructor() {
    this.logger = getLogger("online.service");
  }

  api(): OnlineServiceImpl {
    return this.service;
  }

  public async init(): Promise<this> {
    this.onlineRepository = await gr.database.getRepository(ONLINE_TYPE, UserOnline);

    this.pubsubService = new OnlinePubsubService();
    this.job = new OnlineJob();

    await this.pubsubService.init();
    await this.job.init();

    gr.platformServices.websocket.onUserConnected(event => {
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

    gr.platformServices.websocket.onUserDisconnected(event => {
      this.logger.info("User disconnected", event.user.id);
      // Since the user can be connected on several nodes, we cannot directly set it status to offline
      // We do nothing, the cron will do the job...
    });

    return this;
  }

  private async getOnlineStatuses(
    ids: Array<string> = [],
    context?: ExecutionContext,
  ): Promise<Array<[string, boolean]>> {
    return this.areOnline(ids, context);
  }

  async setLastSeenOnline(
    userIds: Array<string> = [],
    date: number,
    context?: ExecutionContext,
  ): Promise<void> {
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
    await this.onlineRepository.saveAll(onlineUsers, context);
  }

  async isOnline(userId: string, context?: ExecutionContext): Promise<boolean> {
    const user = await this.onlineRepository.findOne({ user_id: userId }, {}, context);

    if (!user) {
      return false;
    }

    return Date.now() - user.last_seen < DISCONNECTED_DELAY;
  }

  private async areOnline(
    ids: Array<string> = [],
    context?: ExecutionContext,
  ): Promise<Array<[string, boolean]>> {
    const users = [];
    //This foreach is needed for $in operators https://github.com/linagora/Twake/issues/1246
    for (let i = 0; i < ids.length; i += 100) {
      users.push(
        ...(
          await this.onlineRepository.find(
            {},
            { $in: [["user_id", ids.slice(i, i + 100)]] },
            context,
          )
        ).getEntities(),
      );
    }

    return users.map(user => [user.user_id, this.isStillConnected(user.last_seen)]);
  }

  /**
   * let's say that a user is connected when its last connection is more than some delay ago
   */
  private isStillConnected(date: number): boolean {
    return Date.now() - date < DISCONNECTED_DELAY;
  }
}
