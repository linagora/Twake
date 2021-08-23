import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import { Message } from '../../../models/Message';
import userAsyncGet from 'services/user/AsyncGet';

export const getSender = (message: Message | undefined) => {
  var senderData: any = {
    type: 'unknown',
  };

  if (message) {
    if (message.sender) {
      senderData = DepreciatedCollections.get('users').find(message.sender, () => {
        if (message.sender) {
          userAsyncGet(message.sender);
        }
      });

      if (!senderData) {
        senderData = {
          type: 'user',
          id: message.sender,
        };
      } else {
        senderData = {...senderData};
        senderData.type = 'user';
      }
    }

    if (message.message_type === 1) {
      //App message
      var app = DepreciatedCollections.get('applications').find(message.application_id) || {};
      if (!app.id) {
        WorkspacesApps.getApp(message.application_id);
      } else {
        senderData = {
          type: 'app',
          application: app,
          username: 'app#' + app?.simple_name,
          firstname: app.name,
          lastname: '',
          thumbnail: WorkspacesApps.getAppIcon(app),
        };
      }
    }
  }

  return senderData;
};
