import { TwakeService } from '../../global/services/twake-service';
import { MessageWithReplies, NodeMessage } from 'app/features/messages/types/message';
import MessageViewAPIClient from './message-view-api-client';
import MessageThreadAPIClient from './message-thread-api-client';
import Api from 'app/features/global/services/api-service';
import { WebsocketRoom } from 'app/features/websocket/types/websocket';

/**
 * This service is to get, update, create, list messages in a thread
 */
@TwakeService('MessageAPIClientService')
class MessageAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';
  private realtime: Map<string, WebsocketRoom[]> = new Map();
  private readonly _viewService = MessageViewAPIClient;
  private readonly threadService = MessageThreadAPIClient;

  websockets(threadId: string): WebsocketRoom[] {
    return this.realtime.get(threadId) || [];
  }

  async list(
    companyId: string,
    threadId: string,
    {
      limit = 25,
      pageToken = '',
      direction = 'future',
    }: { limit?: number; pageToken?: string; direction?: 'future' | 'history' } = {},
  ) {
    const response = await Api.get<{ resources: NodeMessage[]; websockets: WebsocketRoom[] }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages?limit=${limit}&include_users=1&page_token=${pageToken}&direction=${direction}`,
    );
    this.realtime.set(threadId, response.websockets);
    return response.resources;
  }

  async get(companyId: string, threadId: string, messageId: string) {
    const response = await Api.get<{ resource: MessageWithReplies }>(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages/${messageId}?include_users=1`,
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
    message: Partial<NodeMessage>,
    {
      movedFromThread = undefined,
    }: {
      movedFromThread?: string;
    } = {},
  ) {
    const response = await Api.post<
      { resource: Partial<NodeMessage>; options: { previous_thread?: string } },
      { resource: NodeMessage }
    >(
      `${this.prefixUrl}/companies/${companyId}/threads/${threadId}/messages${
        message.id ? '/' + message.id : ''
      }`,
      { resource: message, options: { previous_thread: movedFromThread } },
    );
    return response.resource;
  }
}

export default new MessageAPIClient();
