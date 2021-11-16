import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import { Message } from '../../../models/Message';
import userAsyncGet from 'services/user/AsyncGet';
import { getApplication } from 'app/state/recoil/hooks/useCompanyApplications';

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
        senderData = { ...senderData };
        senderData.type = 'user';
      }
    }

    if (message.message_type === 1) {
      //App message
      var app = getApplication(message.application_id || '');
      if (!app?.id) {
        app = getApplication(message.application_id || '');
      }

      if (app?.id) {
        senderData = {
          type: 'app',
          application: app,
          username: 'app#' + app?.identity?.code,
          firstname: app.identity?.icon,
          lastname: '',
          thumbnail: WorkspacesApps.getAppIcon(app),
        };
      }
    }
  }

  return senderData;
};
