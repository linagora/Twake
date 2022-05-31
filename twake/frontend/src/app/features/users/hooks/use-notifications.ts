import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import { useRealtimeRoom } from 'app/features/global/hooks/use-realtime';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import _ from 'lodash';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
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
import { useCallback } from 'react';
import { pushDesktopNotification } from '../services/push-desktop-notification';

export let removeBadgesNow = (type: 'channel' | 'workspace' | 'company', id: string) => {};

export const useNotifications = () => {
  const [badges, setBadges] = useRecoilState(NotificationsBadgesState);
  const companyId = useRouterCompany();

  const addBadges = useRecoilCallback(
    ({ snapshot }) =>
      (newBadges: NotificationType[]) => {
        const badges = snapshot.getLoadable(NotificationsBadgesState).getValue();
        const list = _.uniqBy([...badges, ...newBadges], 'id');
        setBadges(list);
      },
    [setBadges, badges],
  );

  const removeBadges = useRecoilCallback(
    ({ snapshot }) =>
      (removedBadges: NotificationType[]) => {
        const badges = snapshot.getLoadable(NotificationsBadgesState).getValue();
        const list = _.differenceBy(badges, removedBadges, 'id');
        setBadges(list);
      },
    [setBadges, badges],
  );

  const removeObjectBadges = useRecoilCallback(
    ({ snapshot }) =>
      (type: 'channel' | 'workspace' | 'company', id: string) => {
        const badges = snapshot.getLoadable(NotificationsBadgesState).getValue();
        const list = badges.filter(
          b =>
            (type === 'channel' && b.channel_id !== id) ||
            (type === 'workspace' && b.workspace_id !== id) ||
            (type === 'company' && b.company_id !== id),
        );
        setBadges(list);
      },
    [setBadges, badges],
  );
  removeBadgesNow = removeObjectBadges;

  const setCompanyBadges = useRecoilCallback(
    ({ snapshot }) =>
      (newBadges: NotificationType[], companyId: string) => {
        const badges = snapshot.getLoadable(NotificationsBadgesState).getValue();
        let list = _.uniqBy(
          [...badges.filter(b => b.company_id !== companyId), ...newBadges],
          'id',
        );
        setBadges(list);
      },
    [setBadges, badges],
  );

  useGlobalEffect(
    'useCompanyNotifications',
    async () => {
      if (companyId) {
        const updatedBadges = await userNotificationApiClient.getCompanyBadges(companyId);
        const updatedOtherCompaniesBadges = await userNotificationApiClient.getAllCompaniesBadges();
        setCompanyBadges([...updatedOtherCompaniesBadges, ...updatedBadges], companyId);
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

  const realtimeEvent = useCallback(
    async (action, resource) => {
      if (action === 'event' && resource._type === 'notification:desktop')
        pushDesktopNotification(resource);
      if (action === 'saved') addBadges([resource]);
      if (action === 'deleted') removeBadges([resource]);
    },
    [addBadges, removeBadges],
  );
  let room = userNotificationApiClient.websocket();
  useRealtimeRoom<any>(room, 'useNotifications', realtimeEvent);

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
