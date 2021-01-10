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
import Numbers from 'services/utils/Numbers.js';
import ChannelsService from 'services/channels/channels.js';
import emojione from 'emojione';

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
  private ignoreNextNotification: boolean = false;
  public store: {
    unreadCompanies: { [key: string]: boolean };
    unreadWorkspaces: { [key: string]: boolean };
  } = {
    unreadCompanies: {},
    unreadWorkspaces: {},
  };

  constructor() {
    super();
    this.newNotificationAudio = new window.Audio('/public/sounds/newnotification.wav');
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
        notificationsCollection.setOptions({
          reloadStrategy: 'ontime',
        });
        notificationsCollection.getTransport().start();

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
      if (websockets && this.notificationCount < notifications.length) {
        const lastNotification = notifications.sort((a, b) => {
          return Numbers.compareTimeuuid(b.data.thread_id, a.data.thread_id);
        })[0];

        this.triggerUnreadMessagesPushNotification(lastNotification || null); //TODO pass new notification as parameter
      }
      this.notificationCount = notifications.length;

      // Count notifications:
      // - other group notifications are not counted
      // - other workspace notifications count as one
      // - if I don't know a channel, don't count it + mark it as read => /!\ need to be very sure we are not in the channel
      let badgeCount = 0;
      const state = RouterService.getStateFromRoute();
      const ignore: any = [];
      this.store.unreadCompanies = {};
      this.store.unreadWorkspaces = {};
      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        if (
          ignore.indexOf(notification.data.company_id) >= 0 ||
          ignore.indexOf(notification.data.workspace_id) >= 0
        ) {
          return;
        }
        this.store.unreadCompanies[notification.data.company_id] = true;
        this.store.unreadWorkspaces[notification.data.workspace_id] = true;

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
          (async () => {
            const collection: Collection<ChannelResource> = ChannelsService.getCollection(
              notification.data.company_id,
              notification.data.workspace_id,
            );
            const channel = await collection.findOne({ id: notification.data.channel_id });

            let channelExists = true;
            if (!channel || !channel.data?.user_member?.id) {
              channelExists = false;
            }

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
          })();
        }
      }
      this.updateAppBadge(badgeCount);
      this.notify();
    });
  }

  triggerUnreadMessagesPushNotification(newNotification: NotificationResource | null = null) {
    if (this.ignoreNextNotification) {
      this.ignoreNextNotification = false;
      return;
    }
    if (this.youHaveNewMessagesDelay) {
      clearTimeout(this.youHaveNewMessagesDelay);
    }
    this.youHaveNewMessagesDelay = setTimeout(async () => {
      let title = 'New messages';
      let message = '💬 You have new unread notifications on Twake';

      // Build more detailed message and title
      if (newNotification) {
        const collection: Collection<ChannelResource> = ChannelsService.getCollection(
          newNotification.data.company_id,
          newNotification.data.workspace_id,
        );
        const channel = await collection.findOne({ id: newNotification.data.channel_id });

        if (channel && channel?.data?.name) {
          let icon = '💬';
          if (channel?.data?.icon) {
            icon = emojione.shortnameToUnicode(channel?.data?.icon) || icon;
          }
          title = icon + ' ' + channel.data.name;
          message = 'You have a new message';
        }
      }

      if (this.newNotificationAudio) {
        this.newNotificationAudio.play();
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
    }, 500);
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
    this.ignoreNextNotification = true;
    channel.action('read', { value: false });
  }
}

const notificationsService = new Notifications();
export default notificationsService;
