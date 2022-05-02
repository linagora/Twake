import { Configuration, Consumes, getLogger, TwakeLogger, TwakeService } from "../../framework";
import { localEventBus } from "../../framework/pubsub";
import KnowledgeGraphAPI from "./provider";
import Workspace from "../../../../services/workspaces/entities/workspace";
import Company from "../../../../services/user/entities/company";
import User from "../../../../services/user/entities/user";
import { Channel } from "../../../../services/channels/entities";
import { Message } from "../../../../services/messages/entities/messages";
import { KnowledgeGraphGenericEventPayload, KnowledgeGraphEvents } from "./types";
import KnowledgeGraphAPIClient from "./api-client";

@Consumes([])
export default class KnowledgeGraphService
  extends TwakeService<KnowledgeGraphAPI>
  implements KnowledgeGraphAPI
{
  readonly name = "knowledge-graph";
  readonly version = "1.0.0";
  protected kgAPIClient: KnowledgeGraphAPIClient = this.getKnowledgeGraphApiClient();
  logger: TwakeLogger = getLogger("knowledge-graph-service");

  async doInit(): Promise<this> {
    const configuration = new Configuration("knowledge-graph");
    const active = configuration.get<boolean>("active");

    if (!active) {
      this.logger.warn("Knowledge graph is not active in default.json");

      return this;
    }

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Company>>(
      KnowledgeGraphEvents.COMPANY_CREATED,
      this.onCompanyCreated.bind(this),
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Workspace>>(
      KnowledgeGraphEvents.WORKSPACE_CREATED,
      this.onWorkspaceCreated.bind(this),
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Channel>>(
      KnowledgeGraphEvents.CHANNEL_CREATED,
      this.onChannelCreated.bind(this),
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<Message>>(
      KnowledgeGraphEvents.MESSAGE_CREATED,
      this.onMessageCreated.bind(this),
    );

    localEventBus.subscribe<KnowledgeGraphGenericEventPayload<User>>(
      KnowledgeGraphEvents.USER_CREATED,
      this.onUserCreated.bind(this),
    );

    return this;
  }

  async onCompanyCreated(data: KnowledgeGraphGenericEventPayload<Company>): Promise<void> {
    this.logger.info(`${KnowledgeGraphEvents.COMPANY_CREATED} %o`, data);

    if (this.kgAPIClient) this.kgAPIClient.onCompanyCreated(data.resource);
  }

  async onWorkspaceCreated(data: KnowledgeGraphGenericEventPayload<Workspace>): Promise<void> {
    this.logger.info(`${KnowledgeGraphEvents.WORKSPACE_CREATED} %o`, data);

    if (this.kgAPIClient) this.kgAPIClient.onWorkspaceCreated(data.resource);
  }

  async onChannelCreated(data: KnowledgeGraphGenericEventPayload<Channel>): Promise<void> {
    this.logger.info(`${KnowledgeGraphEvents.CHANNEL_CREATED} %o`, data);

    if (this.kgAPIClient) this.kgAPIClient.onChannelCreated(data.resource);
  }

  async onMessageCreated(data: KnowledgeGraphGenericEventPayload<Message>): Promise<void> {
    this.logger.debug(`${KnowledgeGraphEvents.MESSAGE_CREATED} %o`, data);

    const companyId = data.links.reduce<string>(
      (acc, link) => (link.type === "channel" ? (acc = link.id) : ""),
      "",
    );

    if (this.kgAPIClient && companyId.length)
      this.kgAPIClient.onMessageCreated(companyId, data.resource);
  }

  async onUserCreated(data: KnowledgeGraphGenericEventPayload<User>): Promise<void> {
    this.logger.info(`${KnowledgeGraphEvents.USER_CREATED} %o`, data);

    const companyId = data.links.reduce<string>(
      (acc, link) => (link.type === "company" ? (acc = link.id) : ""),
      "",
    );
    if (this.kgAPIClient) this.kgAPIClient.onUserCreated(companyId, data.resource);
  }

  private getKnowledgeGraphApiClient(): KnowledgeGraphAPIClient {
    const configuration = new Configuration("knowledge-graph");
    const endpoint = configuration.get<string>("endpoint");

    if (endpoint && endpoint.length) {
      this.kgAPIClient = new KnowledgeGraphAPIClient(endpoint);
    } else {
      this.logger.info("KnowledgeGraph - No endpoint defined in default.json");
    }

    return this.kgAPIClient;
  }

  api(): KnowledgeGraphAPI {
    return this;
  }
}
