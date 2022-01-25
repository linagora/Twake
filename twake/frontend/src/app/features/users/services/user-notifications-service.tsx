import React from 'react';
import { notification as antNotification } from 'antd';
import { X } from 'react-feather';
import emojione from 'emojione';
import Observable from 'app/services/Observable/Observable';
import ElectronService from 'services/electron/electron';
import windowState from 'services/utils/window';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import { ChannelResource, ChannelType } from 'app/features/channels/types/channel';
import { Collection } from '../../../services/CollectionsReact/Collections';
import { NotificationResource } from 'app/models/Notification';
import WorkspacesService from 'app/deprecated/workspaces/workspaces';
import popupManager from 'services/popupManager/popupManager';
import RouterService from '../../router/services/router-service';
import ChannelsService from 'app/deprecated/channels/channels';
import NotificationParameters from 'app/deprecated/user/notification_parameters';
import UserService from 'app/features/users/services/current-user-service';
import NotificationPreferences from '../../../deprecated/user/NotificationPreferences';
import ChannelAPIClient from '../../channels/api/channel-api-client';

type DesktopNotification = {
  channel_id: string;
  company_id: string;
  message_id: string;
  thread_id: string;
  user: string;
  workspace_id: string;
  title: string;
  text: string;
};

let inAppNotificationKey = 0;

const openNotification = (
  notification: { title: string; text: string },
  newNotification: DesktopNotification | null,
  callback: (desktopNotification: DesktopNotification | null, id: string) => void,
) => {
  antNotification.close(inAppNotificationKey.toString());
  inAppNotificationKey++;
  const notificationKey = inAppNotificationKey.toString();
  antNotification.open({
    key: notificationKey,
    message: emojione.shortnameToUnicode(notification.title),
    description: PseudoMarkdownCompiler.compileToSimpleHTML(
      PseudoMarkdownCompiler.compileToJSON(
        (notification.text || '').substr(0, 120) +
          ((notification.text || '').length > 120 ? '...' : ''),
      ),
    ),
    onClick: () => callback(newNotification, notificationKey),
    closeIcon: <X size={16} />,
  });
};

class Notifications extends Observable {
  private newNotificationAudio: HTMLAudioElement;
  private started: boolean = false;
  private processed: string[] = [];

  constructor() {
    super();
    this.newNotificationAudio = new window.Audio('/public/sounds/newnotification.wav');

    this.triggerUnreadMessagesPushNotification =
      this.triggerUnreadMessagesPushNotification.bind(this);
  }

  start() {
    if (this.started) {
      return;
    }
    this.started = true;

    if ('Notification' in window && window.Notification.requestPermission) {
      const request = window.Notification.requestPermission();
      if (request && request.then) {
        request.then(function (result) {});
      }
    }

    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );

    notificationsCollection.getTransport().start();
    notificationsCollection.addEventListener(
      'notification:desktop',
      this.triggerUnreadMessagesPushNotification,
    );

    //Listen websockets
    notificationsCollection.addWatcher(() => {
      this.getNotifications();
    }, {});
  }

  //This method is called each time we change our current company
  subscribeToCurrentCompanyNotifications(companyId: string) {
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );
    notificationsCollection.setOptions({
      reloadStrategy: 'ontime',
      queryParameters: {
        company_id: companyId,
        all_companies: true,
      },
    });
    notificationsCollection.find({}, { limit: 1000, refresh: true });
  }

  getNotifications() {
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );
    const notifications = notificationsCollection.find({});

    // Count notifications:
    // - other group notifications are not counted
    // - other workspace notifications count as one
    // - if I don't know a channel, don't count it + mark it as read => /!\ need to be very sure we are not in the channel
    let badgeCount = 0;
    const state = RouterService.getStateFromRoute();
    const ignore: any = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      if (
        ignore.indexOf(notification.data.company_id) >= 0 ||
        ignore.indexOf(notification.data.workspace_id) >= 0
      ) {
        return;
      }

      if (
        notification.data.company_id !== state.companyId ||
        (notification.data.workspace_id !== state.workspaceId &&
          notification.data.workspace_id !== 'direct')
      ) {
        badgeCount++;
        ignore.push(notification.data.company_id);
        ignore.push(notification.data.workspace_id);
      } else {
        //Detect if we don't know the channel and mark as read in this case (caution here!)
        const collection: Collection<ChannelResource> = ChannelsService.getCollection(
          notification.data.company_id,
          notification.data.workspace_id,
        );
        const channel = collection.findOne(
          { id: notification.data.channel_id },
          { withoutBackend: true },
        );

        let channelExists = true;
        if (!channel || !channel.data?.user_member?.user_id) {
          channelExists = false;
        }

        if (channelExists) {
          badgeCount++;
        } else {
          continue;
        }
      }
    }
    this.updateAppBadge(badgeCount);
    NotificationPreferences.init();
    this.notify();
  }

  async triggerUnreadMessagesPushNotification(newNotification: DesktopNotification | null = null) {
    if (
      NotificationParameters.hasNotificationsDisabled(
        UserService.getCurrentUser()?.notifications_preferences,
      )
    ) {
      return;
    }

    //Fixme: Hack to resolve #1374 Duplicate notification of coming messages
    const identifier =
      newNotification?.message_id ||
      newNotification?.thread_id ||
      newNotification?.title ||
      newNotification?.text ||
      '';
    if (this.processed.includes(identifier)) {
      return;
    }
    this.processed.push(identifier);
    setTimeout(() => {
      this.processed = this.processed.filter(e => e !== identifier);
    }, 5000);
    //End Hack fix

    if (newNotification) {
      let title = '';
      let message = '';

      const collection: Collection<ChannelResource> = ChannelsService.getCollection(
        newNotification.company_id,
        newNotification.workspace_id,
      );
      const channel = collection.findOne({ id: newNotification.channel_id });

      if (channel && channel?.data?.name) {
        let icon = '💬';
        if (channel?.data?.icon) {
          icon = emojione.shortnameToUnicode(channel?.data?.icon) || icon;
        }
        title = icon + ' ' + channel.data.name;
        message = 'You have a new message';
      }

      title = newNotification.title || title;
      message = newNotification.text || message;

      if (!title) {
        return;
      }

      if (this.newNotificationAudio) {
        try {
          this.newNotificationAudio.play();
        } catch (err) {
          console.warn(err);
        }
      }

      const callback = (
        notificationObject: DesktopNotification | null,
        inAppNotificationKey?: string,
      ) => {
        inAppNotificationKey && antNotification.close(inAppNotificationKey);
        popupManager.closeAll();
        if (!notificationObject) {
          return;
        }
        setTimeout(() => {
          let workspaceId = notificationObject.workspace_id;
          if (workspaceId === 'direct') {
            workspaceId = WorkspacesService.getOrderedWorkspacesInGroup(
              notificationObject.company_id,
            )[0]?.id;
          }
          if (workspaceId) {
            RouterService.push(
              RouterService.generateRouteFromState({
                companyId: notificationObject.company_id,
                workspaceId: workspaceId,
                channelId: notificationObject.channel_id,
              }),
            );
          }
        }, 500);
      };

      openNotification(
        {
          title: title,
          text: message,
        },
        newNotification,
        callback.bind(this),
      );

      if ('Notification' in window && window.document.hasFocus) {
        const n = new Notification(title, {
          body: message,
        });
        n.onclick = () => {
          window.focus();
          callback(newNotification);
          n.close();
        };
      }
    }
  }

  updateAppBadge(notifications = 0) {
    windowState.setPrefix(notifications);

    if (notifications > 0) {
      ElectronService.setBadge('' + notifications);
    } else {
      ElectronService.setBadge('');
    }
  }

  read(channel: ChannelType) {
    if (channel?.company_id && channel?.workspace_id && channel?.id) {
      ChannelAPIClient.read(channel.company_id, channel.workspace_id, channel.id, { status: true });
    }
  }

  unread(channel: ChannelType) {
    if (channel?.company_id && channel?.workspace_id && channel?.id) {
      ChannelAPIClient.read(channel.company_id, channel.workspace_id, channel.id, {
        status: false,
      });
    }
  }
}

export default new Notifications();
