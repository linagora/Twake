import { MessageWithReplies } from 'app/models/Message';
import { TwakeService } from '../../../Decorators/TwakeService';
import Api from 'app/services/Api';

/**
 * This service is to get messages using views.
 * A view can be:
 *  - channel feed view
 *  - channel pinned messages view
 *  - my active threads view
 *  - ...
 */
@TwakeService('MessageViewAPIClientService')
class MessageViewAPIClient {
  private readonly prefixUrl: string = '/internal/services/messages/v1';

  async feed(
    companyId: string,
    workspaceId: string,
    channelId: string,
    { repliesPerThread = 5, limit = 25, pageToken = '', direction = 'future' } = {},
  ) {
    const response = await Api.get<{ resources: MessageWithReplies[] }>(
      `${this.prefixUrl}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}/feed?replies_per_thread=${repliesPerThread}&limit=${limit}&page_token=${pageToken}&direction=${direction}&websockets=1`,
    );
    return response.resources;
  }
}

export default new MessageViewAPIClient();
