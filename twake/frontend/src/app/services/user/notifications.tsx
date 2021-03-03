import React from 'react';
import Observable from 'app/services/Observable/Observable';
import ElectronService from 'services/electron/electron.js';
import windowState from 'services/utils/window.js';
import { notification } from 'antd';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import { X } from 'react-feather';
import { ChannelResource } from 'app/models/Channel';
import { Collection } from '../CollectionsReact/Collections';
import { NotificationResource } from 'app/models/Notification';
import WorkspacesService from 'services/workspaces/workspaces.js';
import popupManager from 'services/popupManager/popupManager.js';
import RouterService from '../RouterService';
import ChannelsService from 'services/channels/channels.js';
import emojione from 'emojione';
import NotificationParameters from 'services/user/notification_parameters.js';
import UserService from 'services/user/user.js';

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
const openNotification = (n: any, newNotification: DesktopNotification | null, callback: any) => {
  notification.close(inAppNotificationKey.toString());
  inAppNotificationKey++;
  const notificationKey = inAppNotificationKey.toString();
  notification.open({
    key: notificationKey,
    message: emojione.shortnameToUnicode(n.title),
    description: PseudoMarkdownCompiler.compileToSimpleHTML(
      PseudoMarkdownCompiler.compileToJSON(
        (n.text || '').substr(0, 120) + ((n.text || '').length > 120 ? '...' : ''),
      ),
    ),
    onClick: () => {
      callback(newNotification, notificationKey);
    },
    closeIcon: <X size={16} />,
  });
};

class Notifications extends Observable {
  private newNotificationAudio: any;
  private subscribedCompanies: { [companyId: string]: boolean } = {};

  constructor() {
    super();
    this.newNotificationAudio = new window.Audio('/public/sounds/newnotification.wav');

    this.triggerUnreadMessagesPushNotification = this.triggerUnreadMessagesPushNotification.bind(
      this,
    );
  }

  start() {
    if ('Notification' in window && window.Notification.requestPermission) {
      var request = window.Notification.requestPermission();
      if (request && request.then) {
        request.then(function (result) {});
      }
    }
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

    notificationsCollection.getTransport().start();
    notificationsCollection.removeEventListener(
      'notification:desktop',
      this.triggerUnreadMessagesPushNotification,
    );
    notificationsCollection.addEventListener(
      'notification:desktop',
      this.triggerUnreadMessagesPushNotification,
    );

    //Listen websockets
    notificationsCollection.addWatcher(() => {
      this.getNotifications();
    }, {});

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
          notification.data.workspace_id != 'direct')
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
        inAppNotificationKey && notification.close(inAppNotificationKey);
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
            RouterService.history.push(
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
        var n = new Notification(title, {
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
    windowState.setNotificationsInTitle(notifications);

    if (notifications > 0) {
      ElectronService.setBadge('' + notifications);
    } else {
      ElectronService.setBadge('');
    }
  }

  read(channel: ChannelResource) {
    channel.action('read', { value: true });
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );
    notificationsCollection.remove({ channel_id: channel.id }, { withoutBackend: true });
  }

  unread(channel: ChannelResource) {
    channel.action('read', { value: false });
  }
}

const notificationsService = new Notifications();
export default notificationsService;
