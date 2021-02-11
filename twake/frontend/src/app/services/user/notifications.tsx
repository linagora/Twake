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
const openNotification = (n: any, callback: any) => {
  notification.close(inAppNotificationKey.toString());
  inAppNotificationKey++;
  notification.open({
    key: inAppNotificationKey.toString(),
    message: emojione.shortnameToUnicode(n.title),
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

    this.triggerUnreadMessagesPushNotification = this.triggerUnreadMessagesPushNotification.bind(
      this,
    );

    this.subscribeToCompaniesNotifications();
  }

  //This method is called each time we change our current company
  subscribeToCurrentCompanyNotifications(companyId: string) {
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
      { tag: 'current_company' },
    );
    notificationsCollection.setOptions({
      reloadStrategy: 'ontime',
    });
    notificationsCollection.find(
      {},
      { query: { company_id: companyId }, limit: 1000, refresh: true },
    );
  }

  //This one is called only once on starting platform
  subscribeToCompaniesNotifications() {
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );
    notificationsCollection.setOptions({
      reloadStrategy: 'ontime',
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

    //Load if there is at least one notification for user
    notificationsCollection.findOne({}, { limit: 1 });
    this.getNotifications(notificationsCollection);

    //Listen websockets
    notificationsCollection.addWatcher(() => {
      this.getNotifications(notificationsCollection, true);
    }, {});
  }

  getNotifications(collection: Collection<NotificationResource>, websockets: boolean = false) {
    const notifications = collection.find({});
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
        this.newNotificationAudio.play();
      }

      const callback = () => {
        popupManager.closeAll();
        if (newNotification) {
          RouterService.history.push(
            RouterService.generateRouteFromState({
              companyId: newNotification.company_id,
              workspaceId: newNotification.workspace_id,
              channelId: newNotification.channel_id,
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
