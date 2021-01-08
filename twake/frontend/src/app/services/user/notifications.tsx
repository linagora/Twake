import React from 'react';
import Observable from 'app/services/Observable/Observable';
import ElectronService from 'services/electron/electron.js';
import windowState from 'services/utils/window.js';
import { notification } from 'antd';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import { X } from 'react-feather';
import { ChannelResource } from 'app/models/Channel';
import Collections, { Collection } from '../CollectionsReact/Collections';
import { NotificationResource } from 'app/models/Notification';
import WorkspacesService from 'services/workspaces/workspaces.js';
import popupManager from 'services/popupManager/popupManager.js';
import RouterService from '../RouterService';

const openNotification = (n: any, callback: any) => {
  notification.open({
    message: PseudoMarkdownCompiler.compileToSimpleHTML(
      PseudoMarkdownCompiler.compileToJSON(n.title),
    ),
    description: PseudoMarkdownCompiler.compileToSimpleHTML(
      PseudoMarkdownCompiler.compileToJSON(
        (n.text || '').substr(0, 120) + ((n.text || '').length > 120 ? '...' : ''),
      ),
    ),
    onClick: () => {
      callback();
    },
    closeIcon: <X size={16} />,
  });
};

class Notifications extends Observable {
  private newNotificationAudio: any;
  private subscribedCompanies: { [companyId: string]: boolean } = {};
  private notificationCount = 0;
  private youHaveNewMessagesDelay: any;

  constructor() {
    super();
    this.newNotificationAudio = new window.Audio('./public/sounds/newnotification.wav');
  }

  start() {
    if ('Notification' in window && window.Notification.requestPermission) {
      var request = window.Notification.requestPermission();
      if (request && request.then) {
        request.then(function (result) {});
      }
    }

    this.subscribeToCompaniesNotifications();
  }

  subscribeToCompaniesNotifications() {
    Object.keys(WorkspacesService.user_workspaces).forEach((id: string) => {
      const company = (WorkspacesService.user_workspaces as any)[id].group;
      if (!this.subscribedCompanies[company.id]) {
        const notificationsCollection = Collection.get(
          '/notifications/v1/badges/',
          NotificationResource,
          {
            tag: company.id,
            queryParameters: { company_id: company.id },
          },
        );

        //Load if there is at least one notification in group
        notificationsCollection.findOne({}, { limit: 1 }).then(() => {
          this.getNotifications(notificationsCollection);

          //Listen websockets
          notificationsCollection.addWatcher(
            () => {
              this.getNotifications(notificationsCollection, true);
            },
            { company_id: company.id },
          );
        });

        this.subscribedCompanies[company.id] = true;
      }
    });
  }

  getNotifications(collection: Collection<NotificationResource>, websockets: boolean = false) {
    collection.find({}).then(async notifications => {
      if (websockets && this.notificationCount != notifications.length) {
        this.triggerUnreadMessagesPushNotification(); //TODO pass new notification as parameter
      }
      this.notificationCount = notifications.length;

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
          //TODO detect if we don't know the channel and mark as read in this case (caution here!)
          const channelExists = true;
          if (channelExists) {
            badgeCount++;
          } else {
            const path = `/channels/v1/companies/${notification.data.company_id}/workspaces/${notification.data.workspace_id}/channels/::mine`;
            const collection = Collections.get(path, ChannelResource);
            const resource = new ChannelResource({
              id: notification.data.channel_id,
              company_id: notification.data.company_id,
              workspace_id: notification.data.workspace_id,
            });
            resource.setCollection(collection);
            this.read(resource);
          }
        }
      }
      this.updateAppBadge(badgeCount);
    });
  }

  triggerUnreadMessagesPushNotification(newNotification: NotificationResource | null = null) {
    if (this.youHaveNewMessagesDelay) {
      clearTimeout(this.youHaveNewMessagesDelay);
    }
    this.youHaveNewMessagesDelay = setTimeout(() => {
      let title = 'New messages';
      let message = '💬 You have new unread notifications on Twake';

      if (newNotification) {
        //TODO build more detailed message and title
      }

      const callback = () => {
        popupManager.closeAll();
        if (newNotification) {
          RouterService.history.push(
            RouterService.generateRouteFromState({
              companyId: newNotification.data.company_id,
              workspaceId: newNotification.data.workspace_id,
              channelId: newNotification.data.channel_id,
            }),
          );
        }
      };

      openNotification(
        {
          title: title,
          text: message,
        },
        callback.bind(this),
      );

      if ('Notification' in window && window.document.hasFocus) {
        var n = new Notification(title, {
          body: message,
        });
        n.onclick = () => {
          window.focus();
          callback.bind(this)();
          n.close();
        };
      }
    }, 5000);
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
  }

  unread(channel: ChannelResource) {
    channel.action('read', { value: false });
  }
}

const notificationsService = new Notifications();
export default notificationsService;
