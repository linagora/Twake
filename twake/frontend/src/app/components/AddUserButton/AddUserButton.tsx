import React from 'react';
import Icon from 'components/Icon/Icon.js';
import Languages from 'services/languages/languages';
import './AddUserButton.scss';
import popupManager from 'services/popupManager/popupManager.js';
import AddUser from 'app/scenes/Client/Popup/AddUser/AddUser';
import AddUserFromTwakeConsole from 'app/scenes/Client/Popup/AddUser/AddUserFromTwakeConsole';
import InitService from 'app/services/InitService';

export default (props: any) => {
  return (
    <div
      className="channel addUserButton"
      onClick={() => {
        if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
          return popupManager.open(<AddUserFromTwakeConsole standalone />);
        } else {
          return popupManager.open(<AddUser standalone />);
        }
      }}
    >
      <div className="icon">
        <div className="iconBox">
          <Icon type="plus" />
        </div>
      </div>
      <div className="text">
        {Languages.t(
          'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
          [],
          'Ajouter des collaborateurs',
        )}
      </div>
    </div>
  );
};
