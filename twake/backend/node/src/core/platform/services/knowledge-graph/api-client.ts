import axios, { AxiosInstance } from "axios";

import {
  KnowledgeGraphCreateBodyRequest,
  KnowledgeGraphCreateCompanyObjectData,
  KnowledgeGraphCreateWorkspaceObjectData,
  KnowledgeGraphCreateUserObjectData,
  KnowledgeGraphCreateChannelObjectData,
  KnowledgeGraphCreateMessageObjectData,
} from "./types";

import Workspace from "../../../../services/workspaces/entities/workspace";
import Company from "../../../../services/user/entities/company";
import User from "../../../../services/user/entities/user";
import { Channel } from "../../../../services/channels/entities";
import { Message } from "../../../../services/messages/entities/messages";
import { getLogger, TwakeLogger } from "../../framework";

export default class KnowledgeGraphAPIClient {
  protected readonly version = "1.0.0";
  protected readonly axiosInstance: AxiosInstance = axios.create();
  readonly apiUrl: string;
  readonly logger: TwakeLogger = getLogger("knowledge-graph-api-client");

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  public onCompanyCreated(company: Partial<Company>): void {
    this.send({
      records: [
        {
          key: "null",
          value: {
            id: "Company",
            properties: {
              company_id: company.id,
              company_name: company.name,
            },
          },
        },
      ],
    });
  }

  public async onWorkspaceCreated(workspace: Partial<Workspace>): Promise<void> {
    const response = await this.send({
      records: [
        {
          key: "null",
          value: {
            id: "Workspace",
            properties: {
              company_id: workspace.company_id,
              workspace_name: workspace.name,
              workspace_id: workspace.id,
            },
          },
        },
      ],
    });

    if (response.statusText === "OK") {
      this.logger.info("onWorkspaceCreated %o", response.config.data);
    }
  }

  public async onUserCreated(companyId: string, user: Partial<User>): Promise<void> {
    const response = await this.send({
      records: [
        {
          key: "null",
          value: {
            id: "User",
            properties: {
              user_id: user.id,
              email: user.email_canonical,
              username: user.username_canonical,
              user_last_activity: user.last_activity.toLocaleString(),
              first_name: user.first_name,
              user_created_at: user.creation_date.toLocaleString(),
              last_name: user.last_name,
              company_id: companyId,
            },
          },
        },
      ],
    });

    if (response.statusText === "OK") {
      this.logger.info("onUserCreated %o", response.config.data);
    }
  }

  public async onChannelCreated(channel: Partial<Channel>): Promise<void> {
    const response = await this.send({
      records: [
        {
          key: "null",
          value: {
            id: "Channel",
            properties: {
              channel_id: channel.id,
              channel_name: channel.name,
              channel_owner: channel.owner,
              workspace_id: channel.workspace_id,
              company_id: channel.company_id,
            },
          },
        },
      ],
    });

    if (response.statusText === "OK") {
      this.logger.info("onChannelCreated %o", response.config.data);
    }
  }

  public async onMessageCreated(
    channelId: string,
    message: Partial<Message>,
    sensitiveData: boolean,
  ): Promise<void> {
    const response = await this.send({
      records: [
        {
          key: "null",
          value: {
            id: "Message",
            properties: {
              message_thread_id: message.thread_id,
              message_created_at: message.created_at.toLocaleString(),
              message_content: sensitiveData ? message.text : "",
              type_message: message.type,
              message_updated_at: message.updated_at.toLocaleString(),
              user_id: message.user_id,
              channel_id: channelId,
              workspace_id: message.cache?.workspace_id,
              company_id: message.cache?.company_id,
            },
          },
        },
      ],
    });

    if (response.statusText === "OK") {
      this.logger.info("onMessageCreated %o", response.config.data);
    }
  }

  private async send(data: any) {
    return await this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateMessageObjectData[]>
    >(`${this.apiUrl}/topics/twake`, data, {
      headers: {
        "Content-Type": "application/vnd.kafka.json.v2+json",
        Accept: "application/vnd.kafka.v2+json",
      },
    });
  }
}
