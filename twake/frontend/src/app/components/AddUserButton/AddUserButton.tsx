import React from 'react';
import Icon from 'components/Icon/Icon.js';
import Languages from 'services/languages/languages';
import './AddUserButton.scss';
import popupManager from 'services/popupManager/popupManager.js';
import AddUserByEmail from 'app/views/client/popup/AddUser/AddUserByEmail';

export default (props: any) => {
  return (
    <div
      className="channel addUserButton"
      onClick={() => {
        return popupManager.open(<AddUserByEmail standalone />);
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
