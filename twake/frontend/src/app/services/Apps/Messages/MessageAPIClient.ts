import { Message } from 'app/models/Message';
import Api from 'app/services/Api';
import RouterServices from 'services/RouterService';

type ResponseFileType = { resource: any };
type ResponseDeleteFileType = { status: 'success' | 'error' };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };
type DownloadContextType = BaseContentType & { fileId: string };

class MessageAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';

  public getRoute({
    companyId,
    threadId = undefined,
    fullApiRouteUrl = false,
  }: {
    companyId: string;
    threadId?: string | null;
    fullApiRouteUrl?: boolean;
  }): string {
    const route = `${this.prefixUrl}/companies/${companyId}/threads${
      threadId !== undefined ? `/${threadId}` : ''
    }`;

    return fullApiRouteUrl ? Api.route(route) : route;
  }

  private buildRequestObj({
    type,
    company_id,
    workspace_id = 'direct',
    message_id,
    thread_id,
    message,
  }: {
    thread_id?: string;
    message_id?: string;
    company_id: string;
    type: 'user' | 'channel';
    workspace_id?: 'direct' | string;
    message?: Message;
  }) {
    return {
      resource: {
        participants: [
          {
            type,
            id: thread_id || message_id,
            company_id,
            workspace_id, //: "uuid" | "direct", //type=channels only
          },
        ],
      },
      options: {
        message,
      },
    };
  }

  public save(message: Message) {
    const { workspaceId, companyId } = RouterServices.getStateFromRoute();

    if (!companyId) return;

    const route = this.getRoute({ companyId, threadId: message?.parent_message_id });

    console.log({ route, message });
    // We are on a thread
    if (message.parent_message_id && workspaceId) {
      console.log('We are on thread, we should add the message', { resource: message });
    } else {
      // We create a new thread
      const requestObj = this.buildRequestObj({
        type: 'channel',
        company_id: companyId,
        thread_id: message.id,
        workspace_id: workspaceId,
        message,
      });

      console.log('We create a new thread, we should add the requestObj', { ...requestObj });

      Api.post<typeof requestObj, any>(route, requestObj);
    }
  }
}

export default new MessageAPIClient();
