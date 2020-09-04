import React from 'react';
import Languages from 'services/languages/languages.js';
import Table from 'components/Table/Table.tsx';
import UserService from 'services/user/user.js';

export default class Members extends React.Component {
  matchUser(users, query) {
    if (users && query) {
      users.map(user => {
        switch (query.toLowerCase()) {
          case user.user.firstname.toLowerCase():
          case user.user.lastname.toLowerCase():
          case user.user.username.toLowerCase():
            console.log('Match with USER: ', user);
            console.log('user.user.username: ', user.user.username);
            console.log('user.user.firstname: ', user.user.firstname);
            console.log('user.user.lastname: ', user.user.lastname);
            console.log('searchFieldValue: ', query);
          default:
            break;
        }
      });
    } else return console.log('no data or no inputValue');
  }

  render() {
    return (
      <div>
        <Table
          onAdd
          onRequestNextPage={() =>
            new Promise(resolve => {
              resolve(this.props.users);
            })
          }
          onSearch={(query, maxResults) =>
            new Promise(resolve => {
              resolve(this.props.users, this.matchUser(this.props.users, query));
            })
          }
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
        />
      </div>
    );
  }
}
