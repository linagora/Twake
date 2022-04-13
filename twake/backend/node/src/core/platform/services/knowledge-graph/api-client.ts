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

  // FIXME:  This shouldn't be hardcoded, add this url to the config ?
  protected readonly apiUrl = "http://127.0.0.1:8888";

  public onCompanyCreated(company: Company): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateCompanyObjectData[]>
    >(`${this.apiUrl}/graph/create/company`, {
      records: [
        {
          key: company.id,
          value: {
            id: company.id,
            properties: {
              company_id: company.id,
              company_name: company.name,
            },
          },
        },
      ],
    });
  }

  public onWorkspaceCreated(workspace: Workspace): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateWorkspaceObjectData[]>
    >(`${this.apiUrl}/graph/create/workspace`, {
      records: [
        {
          key: workspace.id,
          value: {
            id: workspace.id,
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

  public onUserCreated(companyId: string, user: User): void {
    this.axiosInstance.post<KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateUserObjectData[]>>(
      `${this.apiUrl}/graph/create/user`,
      {
        records: [
          {
            key: user.id,
            value: {
              id: user.id,
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

  public onChannelCreated(channel: Channel): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateChannelObjectData[]>
    >(`${this.apiUrl}/graph/create/channel`, {
      records: [
        {
          key: channel.id,
          value: {
            id: channel.id,
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

  public onMessageCreated(channelId: string, message: Message): void {
    this.axiosInstance.post<
      KnowledgeGraphCreateBodyRequest<KnowledgeGraphCreateMessageObjectData[]>
    >(`${this.apiUrl}/graph/create/message`, {
      records: [
        {
          key: message.id,
          value: {
            id: message.id,
            properties: {
              message_thread_id: message.thread_id,
              message_created_at: message.created_at.toLocaleString(),
              message_content: message.text,
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
