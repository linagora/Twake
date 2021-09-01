import React from 'react';
import Languages from 'services/languages/languages';
import Table from 'components/Table/Table.tsx';
import Workspaces from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.ts';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';
import Menu from 'components/Menus/Menu.js';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import popupManager from 'services/popupManager/popupManager.js';
import AddUser from 'app/scenes/Client/Popup/AddUser/AddUser';
import AlertManager from 'services/AlertManager/AlertManager';
import CreateCompanyAccount from '../CreateCompanyAccount.js';
import MediumPopupManager from 'app/components/Modal/ModalManager';
import InitService from 'app/services/InitService';
import AddUserFromTwakeConsole from 'app/scenes/Client/Popup/AddUser/AddUserFromTwakeConsole';

export default class Pending extends React.Component {
  render() {
    return (
      <div>
        <Table
          onAdd={
            workspaceUserRightsService.hasWorkspacePrivilege() &&
            (() => {
              if (true) {
                // TODO use the same component
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
                Workspaces.currentGroupId,
                Workspaces.currentWorkspaceId,
                'pending',
                100,
                refresh,
              );

              console.log('statetaz', state);

              resolve(Object.values(state.list));
            })
          }
          updatedData={col => {
            console.log('Pending email col', col);
            return (
              col?.email &&
              WorkspacesMembersTable.getElement(Workspaces.currentWorkspaceId, 'pending', col.email)
            );
          }}
          column={[
            {
              title: 'Email',
              render: col => (
                <div className="absolute_position">
                  <div className="fix_text_padding_medium text-complete-width">{col.email}</div>
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
                            MediumPopupManager.open(<CreateCompanyAccount email={col.email} />, {
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
                              () => workspacesUsers.removeInvitation(col.email),
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
