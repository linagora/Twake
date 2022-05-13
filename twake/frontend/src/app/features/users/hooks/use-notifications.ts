import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import _ from 'lodash';
import { useRecoilState, useRecoilValue } from 'recoil';
import userNotificationApiClient from '../api/user-notification-api-client';
import {
  NotificationsBadgesState,
  NotificationsChannelBadgesSelector,
  NotificationsCompanyBadgesSelector,
  NotificationsOtherCompanyBadgesSelector,
  NotificationsWorkspaceBadgesSelector,
} from '../state/atoms/notifications';
import { NotificationType } from '../types/notification-types';
import ElectronService from 'app/features/global/framework/electron-service';
import windowState from 'app/features/global/utils/window';
import RouterService from '../../router/services/router-service';

export const useNotifications = () => {
  const [badges, setBadges] = useRecoilState(NotificationsBadgesState);
  const companyId = useRouterCompany();

  const addBadges = (newBadges: NotificationType[]) => {
    setBadges(_.uniqBy([...badges, ...newBadges], 'id'));
  };

  const removeBadges = (removedBadges: NotificationType[]) => {
    setBadges(_.differenceBy(badges, removedBadges, 'id'));
  };

  const setCompanyBadges = (newBadges: NotificationType[], companyId: string) => {
    setBadges(_.uniqBy([...badges.filter(b => b.company_id !== companyId), ...newBadges], 'id'));
  };

  useGlobalEffect(
    'useNotifications',
    async () => {
      if ('Notification' in window && window.Notification.requestPermission) {
        const request = window.Notification.requestPermission();
        if (request && request.then) {
          request.then(function (result) {});
        }
      }

      const updatedBadges = await userNotificationApiClient.getAllCompaniesBadges();
      addBadges(updatedBadges);
    },
    [],
  );

  useGlobalEffect(
    'useCompanyNotifications',
    async () => {
      if (companyId) {
        const updatedBadges = await userNotificationApiClient.getCompanyBadges(companyId);
        setCompanyBadges(updatedBadges, companyId);
      }
    },
    [companyId],
  );

  useGlobalEffect(
    'useNotificationsSetWindowBadges',
    () => {
      let notifications = 0;
      const state = RouterService.getStateFromRoute();
      const ignore: any = [];
      for (const notification of badges) {
        if (
          ignore.indexOf(notification.company_id) >= 0 ||
          ignore.indexOf(notification.workspace_id) >= 0
        )
          return;

        if (
          notification.company_id !== state.companyId ||
          (notification.workspace_id !== state.workspaceId &&
            notification.workspace_id !== 'direct')
        ) {
          notifications++;
          ignore.push(notification.company_id);
          ignore.push(notification.workspace_id);
        } else {
          notifications++;
        }
      }

      windowState.setPrefix(notifications);
      if (notifications > 0) {
        ElectronService.setBadge('' + notifications);
      } else {
        ElectronService.setBadge('');
      }
    },
    [badges],
  );

  let room = userNotificationApiClient.websocket();
  useRealtimeRoom<any>(room, 'useNotifications', async (action, resource) => {
    if (action === 'saved') addBadges([resource]);
    if (action === 'deleted') removeBadges([resource]);
  });

  return {
    badges,
  };
};

export const useCompanyNotifications = (id: string) => {
  const badges = useRecoilValue(NotificationsCompanyBadgesSelector(id));
  return {
    badges,
  };
};

export const useOtherCompanyNotifications = (id: string) => {
  const badges = useRecoilValue(NotificationsOtherCompanyBadgesSelector(id));
  return {
    badges,
  };
};

export const useWorkspaceNotifications = (id: string) => {
  const badges = useRecoilValue(NotificationsWorkspaceBadgesSelector(id));
  return {
    badges,
  };
};

export const useChannelNotifications = (id: string) => {
  const badges = useRecoilValue(NotificationsChannelBadgesSelector(id));
  return {
    badges,
  };
};
