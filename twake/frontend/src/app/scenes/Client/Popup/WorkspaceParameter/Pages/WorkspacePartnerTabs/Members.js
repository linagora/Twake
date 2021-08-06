import React from 'react';
import Languages from 'services/languages/languages';
import Table from 'components/Table/Table.tsx';
import UserService from 'services/user/UserService';
import Workspaces from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import AddUser from 'app/scenes/Client/Popup/AddUser/AddUser';
import AddUserFromTwakeConsole from 'app/scenes/Client/Popup/AddUser/AddUserFromTwakeConsole';
import InitService from 'app/services/InitService';
import { Tag } from 'antd';
import RouterServices from 'services/RouterService';
import { getUserParts } from 'app/components/Member/UserParts';

export default class Members extends React.Component {
  render() {
    const { companyId } = RouterServices.getStateFromRoute();
    const adminLevel = workspacesUsers.getAdminLevel().id;
    return (
      <div>
        <Table
          onAdd={
            workspaceUserRightsService.hasWorkspacePrivilege() &&
            (() => {
              if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
                return popupManager.open(<AddUserFromTwakeConsole standalone />);
              } else {
                return popupManager.open(<AddUser standalone />);
              }
            })
          }
          addText={Languages.t(
            'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
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
              title: Languages.t('scenes.app.popup.workspaceparameter.pages.table_title'),
              dataIndex: 'name',
              render: col => {
                var tags = [];
                const { users, companyRole } = getUserParts({ usersIds: [col.user.id] });

                if (col.level === adminLevel) {
                  tags.push(
                    <Tag color="var(--warning)">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.administrater_status',
                      )}
                    </Tag>,
                  );
                }
                UserService.getUserRole(users[0], companyId) !== 'member' && tags.push(companyRole);

                return (
                  <div
                    className="absolute_position"
                    style={{ paddingRight: 8, boxSizing: 'border-box' }}
                  >
                    <div
                      className="user_image"
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
