import React from 'react';
import { notification as antNotification } from 'antd';
import { X } from 'react-feather';
import emojione from 'emojione';
import Observable from 'app/deprecated/Observable/Observable';
import ElectronService from 'app/features/global/framework/electron-service';
import windowState from 'app/features/global/utils/window';
import PseudoMarkdownCompiler from 'app/features/global/services/pseudo-markdown-compiler-service';
import { ChannelType } from 'app/features/channels/types/channel';
import { Collection } from '../../../deprecated/CollectionsReact/Collections';
import { NotificationResource } from 'app/features/users/types/notification-types';
import WorkspacesService from 'app/deprecated/workspaces/workspaces';
import popupManager from 'app/deprecated/popupManager/popupManager';
import RouterService from '../../router/services/router-service';
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
      const title = newNotification.title || '';
      const message = newNotification.text || '';

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
