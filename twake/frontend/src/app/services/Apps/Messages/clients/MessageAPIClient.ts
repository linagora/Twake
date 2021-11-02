import { TwakeService } from '../../../Decorators/TwakeService';
import { NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from './MessageViewAPIClient';
import MessageThreadAPIClient from './MessageThreadAPIClient';
import Api from 'app/services/Api';

/**
 * This service is to get, update, create, list messages in a thread
 */
@TwakeService('MessageAPIClientService')
class MessageAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';
  private readonly _viewService = MessageViewAPIClient;
  private readonly threadService = MessageThreadAPIClient;

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
    message: NodeMessage,
    {
      movedFromThread = undefined,
    }: {
      movedFromThread?: string;
    } = {},
  ) {
    const response = await Api.post<
      { resource: NodeMessage; options: { previous_thread?: string } },
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
