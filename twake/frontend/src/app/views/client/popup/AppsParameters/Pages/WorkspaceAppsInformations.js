import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import InputWithClipBoard from 'components/input-with-clip-board/input-with-clip-board.js';
import workspaceService from 'services/workspaces/workspaces.js';
import userService from 'services/user/UserService';
import './Pages.scss';

export default class WorkspaceAppsInformations extends Component {
  render() {
    return (
      <div className="apps">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.title_informations',
            'Basic informations',
          )}
        </div>
        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.subtitle_informations',
              'Informations related to applications management',
            )}
          </div>

          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.smalltext_user_id',
              'Current user id',
            )}
          </div>
          <InputWithClipBoard disabled={true} value={userService.getCurrentUserId()} />

          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.smalltext_workspace_id',
              'Current workspace id',
            )}
          </div>
          <InputWithClipBoard disabled={true} value={workspaceService.currentWorkspaceId} />

          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.smalltext_group_id',
              'Current group id',
            )}
          </div>
          <InputWithClipBoard disabled={true} value={workspaceService.currentGroupId} />
        </div>
      </div>
    );
  }
}
