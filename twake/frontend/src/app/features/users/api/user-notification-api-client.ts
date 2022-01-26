import Api from '../../global/framework/api-service';
import { NotificationType } from 'app/features/users/types/notification-types';
import { TwakeService } from '../../global/framework/registry-decorator-service';

@TwakeService('UserNotificationAPIClientService')
class UserNotificationAPIClient {
  async getAllCompaniesBadges(): Promise<NotificationType[]> {
    return Api.get<{ resources: NotificationType[] }>(
      '/internal/services/notifications/v1/badges?all_companies=true',
    ).then(response => (response.resources ? response.resources : []));
  }
}

export default new UserNotificationAPIClient();
