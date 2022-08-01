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
    const use = this.getConfigurationEntry<boolean>("use");

    if (!use) {
      this.logger.warn("Knowledge graph is not used");

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
    const forwardedCompanies = this.getConfigurationEntry<string[]>("forwarded_companies");
    this.logger.info(`${KnowledgeGraphEvents.COMPANY_CREATED} %o`, data);

    if (
      this.kgAPIClient &&
      (forwardedCompanies.includes(data.resource.id) || forwardedCompanies.length === 0)
    ) {
      this.kgAPIClient.onCompanyCreated(data.resource);
    }
  }

  async onWorkspaceCreated(data: KnowledgeGraphGenericEventPayload<Workspace>): Promise<void> {
    const forwardedCompanies = this.getConfigurationEntry<string[]>("forwarded_companies");
    this.logger.info(`${KnowledgeGraphEvents.WORKSPACE_CREATED} %o`, data);

    if (
      this.kgAPIClient &&
      (forwardedCompanies.includes(data.resource.company_id) || forwardedCompanies.length === 0)
    ) {
      this.kgAPIClient.onWorkspaceCreated(data.resource);
    }
  }

  async onChannelCreated(data: KnowledgeGraphGenericEventPayload<Channel>): Promise<void> {
    const forwardedCompanies = this.getConfigurationEntry<string[]>("forwarded_companies");
    this.logger.info(`${KnowledgeGraphEvents.CHANNEL_CREATED} %o`, data);

    if (
      this.kgAPIClient &&
      (forwardedCompanies.includes(data.resource.company_id) || forwardedCompanies.length === 0)
    ) {
      this.kgAPIClient.onChannelCreated(data.resource);
    }
  }

  async onMessageCreated(data: KnowledgeGraphGenericEventPayload<Message>): Promise<void> {
    const forwardedCompanies = this.getConfigurationEntry<string[]>("forwarded_companies");
    const sensitiveData = this.getConfigurationEntry<boolean>("sensitive_data");

    this.logger.debug(`${KnowledgeGraphEvents.MESSAGE_CREATED} %o`, data);

    if (
      this.kgAPIClient &&
      (forwardedCompanies.includes(data.resource.cache.company_id) ||
        forwardedCompanies.length === 0)
    ) {
      this.kgAPIClient.onMessageCreated(
        data.resource.cache.company_id,
        data.resource,
        sensitiveData,
      );
    }
  }

  async onUserCreated(data: KnowledgeGraphGenericEventPayload<User>): Promise<void> {
    const forwardedCompanies = this.getConfigurationEntry<string[]>("forwarded_companies");
    this.logger.info(`${KnowledgeGraphEvents.USER_CREATED} %o`, data);

    const companyId = data.resource.cache.companies.find(v => forwardedCompanies.includes(v));

    if (this.kgAPIClient && (companyId || forwardedCompanies.length === 0)) {
      this.kgAPIClient.onUserCreated(companyId, data.resource);
    }
  }

  private getConfigurationEntry<T>(key: string): T {
    const configuration = new Configuration("knowledge-graph");
    return configuration.get(key);
  }

  private getKnowledgeGraphApiClient(): KnowledgeGraphAPIClient {
    const endpoint = this.getConfigurationEntry<string>("endpoint");

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
