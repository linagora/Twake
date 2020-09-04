import React from 'react';
import Languages from 'services/languages/languages.js';
import Table from 'components/Table/Table';
import UserService from 'services/user/user.js';

export default class Guests extends React.Component {
  render() {
    return (
      <div>
        <Table
          onRequestNextPage={() => {
            return new Promise(resolve => {
              setTimeout(() => resolve(this.props.users), 1000);
            });
          }}
          column={[
            {
              title: 'Name',
              dataIndex: 'name',
              render: col => {
                return (
                  <div
                    className="absolute_position"
                    style={{ paddingRight: 8, boxSizing: 'border-box' }}
                  >
                    <div
                      class="user_image"
                      style={{
                        backgroundImage: 'url(' + UserService.getThumbnail(col.user) + ')',
                      }}
                    />
                    <div className="fix_text_padding_medium text-complete-width">
                      {UserService.getFullName(col.user)} (@{col.user.username})
                    </div>
                  </div>
                );
              },
            },
            {
              title: 'Status',
              width: 300,
              dataIndex: 'level',
              render: col => {
                var tags = [];
                if (col.isAdmin) {
                  tags.push(
                    <div className="tag blue">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.administrater_status',
                        [],
                        'Administrateur',
                      )}
                    </div>,
                  );
                }
                if (col.groupLevel > 0 && col.groupLevel !== null) {
                  tags.push(
                    <div className="tag orange">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.company_manager_status',
                        [],
                        "Gérant d'entreprise",
                      )}
                    </div>,
                  );
                }
                if (col.externe) {
                  tags.push(
                    <div className="tag green">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.guest_status',
                        [],
                        'Invité',
                      )}
                    </div>,
                  );
                }
                return <div className="fix_text_padding_medium">{tags}</div>;
              },
            },
            {
              title: '',
              width: 30,
              dataIndex: 'action',
              render: col => {
                return this.props.buildMenu(col);
              },
            },
          ]}
          data={this.props.users}
        />
      </div>
    );
  }
}
