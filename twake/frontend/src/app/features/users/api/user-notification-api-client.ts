import Api from '../../global/framework/api-service';
import { NotificationType } from 'app/features/users/types/notification-types';
import { TwakeService } from '../../global/framework/registry-decorator-service';
import { WebsocketRoom } from 'app/features/global/types/websocket-types';

@TwakeService('UserNotificationAPIClientService')
class UserNotificationAPIClient {
  private realtime: WebsocketRoom = { room: '', token: '' };

  websocket(): WebsocketRoom {
    return this.realtime;
  }

  async getAllCompaniesBadges(): Promise<NotificationType[]> {
    const response = await Api.get<{ resources: NotificationType[]; websockets: WebsocketRoom[] }>(
      '/internal/services/notifications/v1/badges?limit=1000&websockets=1&all_companies=true',
    );
    if (response.websockets) this.realtime = response.websockets[0];
    return response.resources ? response.resources : [];
  }

  async getCompanyBadges(companyId: string): Promise<NotificationType[]> {
    const response = await Api.get<{ resources: NotificationType[]; websockets: WebsocketRoom[] }>(
      '/internal/services/notifications/v1/badges?limit=1000&websockets=1&company_id=' + companyId,
    );
    if (response.websockets) this.realtime = response.websockets[0];
    return response.resources ? response.resources : [];
  }
}

export default new UserNotificationAPIClient();
