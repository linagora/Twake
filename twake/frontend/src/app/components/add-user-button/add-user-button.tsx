import React from 'react';
import Icon from 'components/icon/icon.js';
import Languages from 'app/features/global/services/languages-service';
import './add-user-button.scss';
import popupManager from 'app/deprecated/popupManager/popupManager.js';
import AddUserByEmail from 'app/views/client/popup/AddUser/AddUserByEmail';

export default () => {
  return (
    <div
      className="channel addUserButton"
      onClick={() => {
        return popupManager.open(<AddUserByEmail  standalone />);
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
