import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import UserListManager from 'components/user-list-manager-depreciated/user-list-manager';
import Menu from 'components/menus/menu.js';

export default class Participants extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="participants">
        <div className="bottom-margin">
          <b>{Languages.t('scenes.apps.calendar.modals.part.participants', [], 'Participants')}</b>
        </div>

        <div className="menu-list">
          <UserListManager
            showAddMe
            showAddAll
            readOnly={this.props.readOnly}
            canRemoveMyself
            noPlaceholder
            users={(this.props.participants || []).map(participant => {
              return { id: participant.user_id_or_mail };
            })}
            scope="workspace"
            allowMails
            onUpdate={ids_mails => {
              this.props.onChange &&
                this.props.onChange(
                  ids_mails.map(id => {
                    return { user_id_or_mail: id };
                  }),
                );
              Menu.closeAll();
            }}
          />
        </div>
      </div>
    );
  }
}
