import { Message } from './MessagesListServerUtils';
import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

export const getSender = (message: Message | undefined) => {
  var senderData: any = {
    type: 'unknown',
  };

  if (message) {
    if (message.sender) {
      senderData = Collections.get('users').find(message.sender);
      if (!senderData) {
        User.asyncGet(message.sender);
        senderData = {
          type: 'user',
          id: message.sender,
        };
      } else {
        senderData.type = 'user';
      }
    }
    if (message.message_type == 1) {
      //App message
      var app = Collections.get('applications').find(message.application_id) || {};
      if (!app.id) {
        WorkspacesApps.getApp(message.application_id);
      } else {
        senderData = {
          type: 'app',
          application: app,
          username: 'app#' + app.simple_name,
          firstname: app.name,
          lastname: '',
          thumbnail: WorkspacesApps.getAppIcon(app),
        };
      }
    }
  }

  return senderData;
};
