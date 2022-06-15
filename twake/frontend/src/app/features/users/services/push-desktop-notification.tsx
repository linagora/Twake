import { notification as antNotification } from 'antd';
import RouterService from '../../router/services/router-service';
import popupManager from 'app/deprecated/popupManager/popupManager';
import emojione from 'emojione';
import React from 'react';
import { X } from 'react-feather';

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

let firstTime = false;
let inAppNotificationKey = 0;
const newNotificationAudio = new window.Audio('/public/sounds/newnotification.wav');

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
    const workspaceId = notificationObject.workspace_id;
    if (workspaceId) {
      RouterService.push(
        RouterService.generateRouteFromState({
          companyId: notificationObject.company_id,
          workspaceId: workspaceId,
          channelId: notificationObject.channel_id,
          threadId: notificationObject.thread_id || '',
        }),
      );
    }
  }, 500);
};

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
    description: notification.text,
    onClick: () => callback(newNotification, notificationKey),
    closeIcon: <X size={16} />,
  });
};

export const pushDesktopNotification = (notification: DesktopNotification) => {
  //Init notification on the browser
  if (firstTime) {
    if ('Notification' in window && window.Notification.requestPermission) {
      const request = window.Notification.requestPermission();
      if (request && request.then) {
        request.then(function (result) {});
      }
    }
    firstTime = false;
  }

  if (notification) {
    const title = notification.title || '';
    const message = notification.text || '';

    if (!title) {
      return;
    }

    if (newNotificationAudio) {
      try {
        newNotificationAudio.play();
      } catch (err) {
        console.warn(err);
      }
    }

    if (window.document.hasFocus()) {
      openNotification(
        {
          title: title,
          text: message,
        },
        notification,
        callback.bind(this),
      );
    }

    if ('Notification' in window && !window.document.hasFocus()) {
      const n = new Notification(title, {
        body: message,
      });
      n.onclick = () => {
        window.focus();
        callback(notification);
        n.close();
      };
    }
  }
};
