import { Message, NodeMessage } from 'app/models/Message';
import Api from 'app/services/Api';
import RouterServices from 'services/RouterService';
import { TwakeService } from '../../Decorators/TwakeService';
import MessageViewAPIClient from './MessageViewAPIClient';

type ResponseFileType = { resource: any };
type ResponseDeleteFileType = { status: 'success' | 'error' };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };
type DownloadContextType = BaseContentType & { fileId: string };

@TwakeService('MessageAPIClientService')
class MessageAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';
  private readonly viewService = MessageViewAPIClient;

  async list(
    companyId: string,
    threadId: string,
    {
      limit = 25,
      pageToken = '',
      direction = 'future',
    }: { limit?: number; pageToken?: string; direction?: 'future' | 'history' } = {},
  ) {
    const response = await Api.get<{ resources: NodeMessage[] }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages?limit=${limit}&page_token=${pageToken}&direction=${direction}`,
    );
    return response.resources;
  }

  async get(companyId: string, threadId: string, messageId: string) {
    const response = await Api.get<{ resource: NodeMessage }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}`,
    );
    return response.resource;
  }

  async reaction(companyId: string, threadId: string, messageId: string, reactions: string[] = []) {
    const response = await Api.post<{ reactions: string[] }, { resource: NodeMessage }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}/reaction`,
      { reactions },
    );
    return response.resource;
  }

  async bookmark(
    companyId: string,
    threadId: string,
    messageId: string,
    bookmarkId: string,
    active: boolean = true,
  ) {
    const response = await Api.post<
      { bookmark_id: string; active: boolean },
      { resource: NodeMessage }
    >(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}/bookmark`,
      { bookmark_id: bookmarkId, active },
    );
    return response.resource;
  }

  async pin(companyId: string, threadId: string, messageId: string, pin: boolean = true) {
    const response = await Api.post<{ pin: boolean }, { resource: NodeMessage }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}/pin`,
      { pin },
    );
    return response.resource;
  }

  async delete(companyId: string, threadId: string, messageId: string) {
    const response = await Api.post<{}, { resource: NodeMessage }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}/delete`,
      {},
    );
    return response.resource;
  }

  async save(
    companyId: string,
    threadId: string,
    message: Message,
    {
      movedFromThread = undefined,
    }: {
      movedFromThread?: string;
      channels?: {
        channelId: string;
        workspaceId: string;
      }[];
    } = {},
  ) {
    /*
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
    }*/
  }
}

export default new MessageAPIClient();
