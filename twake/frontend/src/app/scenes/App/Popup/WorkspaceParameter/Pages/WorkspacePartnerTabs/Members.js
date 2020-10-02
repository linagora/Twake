import React from 'react';
import Languages from 'services/languages/languages.js';
import Table from 'components/Table/Table.tsx';
import UserService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceUserRightsService from 'services/workspaces/workspace_user_rights.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser';

export default class Members extends React.Component {
  render() {
    const adminLevel = workspacesUsers.getAdminLevel().id;
    return (
      <div>
        <Table
          onAdd={
            workspaceUserRightsService.hasWorkspacePrivilege() &&
            (() => {
              popupManager.open(<AddUser standalone />);
            })
          }
          addText={Languages.t(
            'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
            [],
            'Ajouter des collaborateurs',
          )}
          onRequestMore={refresh =>
            new Promise(async resolve => {
              const state = await WorkspacesMembersTable.nextPage(
                Workspaces.currentWorkspaceId,
                'members',
                100,
                refresh,
              );
              resolve(Object.values(state.list));
            })
          }
          onSearch={(query, maxResults, callback) => {
            WorkspacesMembersTable.search(
              Workspaces.currentWorkspaceId,
              'members',
              query,
              maxResults,
              list => {
                callback(list);
              },
            );
          }}
          updatedData={col => {
            return (
              col?.user?.id &&
              WorkspacesMembersTable.getElement(
                Workspaces.currentWorkspaceId,
                'members',
                col.user.id,
              )
            );
          }}
          column={[
            {
              title: 'Name',
              dataIndex: 'name',
              render: col => {
                var tags = [];
                if (col.level === adminLevel) {
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
                      {UserService.getFullName(col.user)} (@{col.user.username}) {col.user.email}
                    </div>

                    <div className="fix_text_padding_medium">{tags}</div>
                  </div>
                );
              },
            },
            {
              title: '',
              width: 30,
              dataIndex: 'action',
              render: col => {
                return (
                  workspaceUserRightsService.hasWorkspacePrivilege() && this.props.buildMenu(col)
                );
              },
            },
          ]}
          resultsPerPage={25}
        />
      </div>
    );
  }
}
