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

export default class KnowledgeGraphAPIClient {
  protected readonly version = "1.0.0";
  protected readonly axiosInstance: AxiosInstance = axios.create();
  readonly apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  public onCompanyCreated(company: Partial<Company>): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateCompanyObjectData[]>
    >(`${this.apiUrl}/graph/create/company`, {
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

  public onWorkspaceCreated(workspace: Partial<Workspace>): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateWorkspaceObjectData[]>
    >(`${this.apiUrl}/graph/create/workspace`, {
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
  }

  public onUserCreated(companyId: string, user: Partial<User>): void {
    this.axiosInstance.post<KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateUserObjectData[]>>(
      `${this.apiUrl}/graph/create/user`,
      {
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
      },
    );
  }

  public onChannelCreated(channel: Partial<Channel>): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateChannelObjectData[]>
    >(`${this.apiUrl}/graph/create/channel`, {
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
            },
          },
        },
      ],
    });
  }

  public onMessageCreated(channelId: string, message: Partial<Message>): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateMessageObjectData[]>
    >(`${this.apiUrl}/graph/create/message`, {
      records: [
        {
          key: "null",
          value: {
            id: "Message",
            properties: {
              message_thread_id: message.thread_id,
              message_created_at: message.created_at.toLocaleString(),
              message_content: "secret", // For now we don't send private data
              type_message: message.type,
              message_updated_at: message.updated_at.toLocaleString(),
              user_id: message.user_id,
              channel_id: channelId,
            },
          },
        },
      ],
    });
  }
}
