import React from 'react';
import Languages from 'services/languages/languages.js';
import Table from 'components/Table/Table.tsx';
import UserService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceUserRightsService from 'services/workspaces/workspace_user_rights.js';
import AddUser from 'app/scenes/Client/Popup/AddUser/AddUser';
import AddUserFromTwakeConsole from 'app/scenes/Client/Popup/AddUser/AddUserFromTwakeConsole';
import InitService from 'app/services/InitService';
import { Tag } from 'antd';

export default class Members extends React.Component {
  render() {
    const adminLevel = workspacesUsers.getAdminLevel().id;
    return (
      <div>
        <Table
          onAdd={
            workspaceUserRightsService.hasWorkspacePrivilege() &&
            (() => {
              if (InitService.server_infos?.auth?.console?.use) {
                return popupManager.open(<AddUserFromTwakeConsole standalone />);
              } else {
                return popupManager.open(<AddUser standalone />);
              }
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
                    <Tag color="var(--primary)">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.administrater_status',
                        [],
                        'Administrateur',
                      )}
                    </Tag>,
                  );
                }
                if (col.groupLevel > 0 && col.groupLevel !== null) {
                  tags.push(
                    <Tag color="var(--warning)">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.company_manager_status',
                        [],
                        "Gérant d'entreprise",
                      )}
                    </Tag>,
                  );
                }
                // TODO find a way to display this tag only when guest member
                // if (true) {
                //   tags.push(
                //     <Tag color="var(--grey-dark)">
                //       {Languages.t('components.workspace.group.guest')}
                //     </Tag>,
                //   );
                // }

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
                      {UserService.getFullName(col.user)} {col.user.email}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>{tags}</div>
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
