import React from 'react';
import Languages from 'services/languages/languages.js';
import Table from 'components/Table/Table.tsx';
import UserService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';
import Menu from 'components/Menus/Menu.js';
import workspaceUserRightsService from 'services/workspaces/workspace_user_rights.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import popupManager from 'services/popupManager/popupManager.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser';
import AlertManager from 'services/AlertManager/AlertManager.js';
import CreateCompanyAccount from '../CreateCompanyAccount.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';

export default class Pending extends React.Component {
  render() {
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
                'pending',
                100,
                refresh,
              );
              resolve(Object.values(state.list));
            })
          }
          updatedData={col => {
            return (
              col?.mail &&
              WorkspacesMembersTable.getElement(Workspaces.currentWorkspaceId, 'pending', col.mail)
            );
          }}
          column={[
            {
              title: 'Email',
              render: col => (
                <div className="absolute_position">
                  <div className="fix_text_padding_medium text-complete-width">{col.mail}</div>
                  {!!col.externe && (
                    <div className="tag green">
                      {Languages.t(
                        'scenes.app.popup.workspaceparameter.pages.extern_guest',
                        [],
                        'Utilisateur invité',
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: '',
              width: 30,
              dataIndex: 'action',
              render: col => {
                if (!workspaceUserRightsService.hasWorkspacePrivilege()) {
                  return '';
                }
                return (
                  <div className="action">
                    <Menu
                      className="option_button"
                      style={{ padding: 4 }}
                      menu={[
                        {
                          type: 'menu',
                          text: Languages.t(
                            'scenes.app.popup.workspace.create_temp',
                            [],
                            'Create temporary account',
                          ),
                          onClick: () => {
                            MediumPopupManager.open(<CreateCompanyAccount email={col.mail} />, {
                              size: { width: 400 },
                            });
                          },
                        },
                        { type: 'separator' },
                        {
                          type: 'menu',
                          className: 'danger',
                          text: Languages.t(
                            'scenes.app.popup.workspaceparameter.pages.cancel_invitation',
                            [],
                            "Annuler l'invitation.",
                          ),
                          onClick: () => {
                            AlertManager.confirm(
                              () => workspacesUsers.removeInvitation(col.mail),
                              () => {},
                              {
                                text: Languages.t(
                                  'scenes.app.popup.workspaceparameter.pages.cancel_invitation_button',
                                  [],
                                  "Annuler l'invitation par mail.",
                                ),
                              },
                            );
                          },
                        },
                      ]}
                    >
                      <EditIcon className="m-icon-small" />
                    </Menu>
                  </div>
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
