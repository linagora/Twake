import { Message, NodeMessage } from 'app/models/Message';
import Api from 'app/services/Api';
import RouterServices from 'services/RouterService';
import { TwakeService } from '../../Decorators/TwakeService';

type ResponseFileType = { resource: any };
type ResponseDeleteFileType = { status: 'success' | 'error' };

type BaseContentType = { companyId: string };
type GetContextType = BaseContentType & { fileId: string };
type DeleteContextType = BaseContentType & { fileId: string };
type DownloadContextType = BaseContentType & { fileId: string };

@TwakeService('MessageViewAPIClientService')
class MessageViewAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';

  async feed(
    companyId: string,
    workspaceId: string,
    channelId: string,
    { repliesPerThread = 5, limit = 25, pageToken = '', direction = 'future' } = {},
  ) {
    const response = await Api.get<{ resources: NodeMessage[] }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/feed?replies_per_thread=${repliesPerThread}&limit=${limit}&page_token=${pageToken}&direction=${direction}`,
    );
    return response.resources;
  }
}

export default new MessageViewAPIClient();
