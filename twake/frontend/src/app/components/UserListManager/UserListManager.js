<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import UsersService from 'services/user/user.js';
import AutoComplete from 'components/AutoComplete/AutoComplete.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import Workspaces from 'services/workspaces/workspaces.js';
import TrashIcon from '@material-ui/icons/DeleteOutlined';
import Strings from 'services/utils/strings.js';
import UserOrMail from 'components/ui/UserOrMail.js';
import Button from 'components/Buttons/Button.js';
import Icon from 'components/Icon/Icon.js';
import OutsideClickHandler from 'react-outside-click-handler';
import './UserListManager.scss';
import Languages from 'services/languages/languages.js';

export default class UserListManager extends React.Component {
  constructor(props) {
    super(props);

    this.props = props;

    this.state = {
      filtered: [],
      input: '',
    };
    this.updateStateFromProps(props, true);
  }
  updateStateFromProps(props, force, nextState) {
    var anti_duplicates = [];

    var user_ids = props.users
      .map(item => item.id || item)
<<<<<<< HEAD
      .filter(function (item, pos) {
=======
      .filter(function(item, pos) {
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        var here = anti_duplicates.indexOf(item) < 0;
        anti_duplicates.push(item);
        return here;
      });

    if (force || JSON.stringify(user_ids) != this.savedUserProps) {
      this.state.users_ids = user_ids;
      if (nextState) {
        nextState.users_ids = user_ids;
      }
      this.savedUserProps = JSON.stringify(user_ids);
    }
  }
  filter(text, callback) {
    this.state.input = text;
    if ((text || '').indexOf('@') > 0) {
      if (
        this.props.allowMails &&
        Strings.verifyMail(text) &&
        this.state.users_ids.indexOf(text.toLocaleLowerCase()) < 0
      ) {
        callback([{ email: text.toLocaleLowerCase() }]);
        return;
      }
      callback([]);
      return;
    }
    if (this.props.scope == 'workspace') {
      var list = Object.keys(
<<<<<<< HEAD
        WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {}
=======
        WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      ).map(id => WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[id]);
      if (this.props.disableExterne) {
        list = list.filter(el => !el.externe);
      }
      var res = list
        .filter(el => {
          return (
            (el.user.username + ' ' + el.user.firstname + ' ' + el.user.lastname)
              .toLocaleLowerCase()
              .indexOf(text.toLocaleLowerCase()) >= 0
          );
        })
        .map(el => el.user);
      callback(
        res.filter(item => {
          if (
            (this.props.hideUsersIds || []).indexOf(item.id) >= 0 ||
            this.state.users_ids.indexOf(item.id) >= 0 ||
            this.state.users_ids.indexOf(item) >= 0
          ) {
            return false;
          }
          return true;
<<<<<<< HEAD
        })
=======
        }),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      );
    }
    if (this.props.scope == 'all') {
      UsersService.search(text, res => {
        res = res.filter(el => {
          return (
            (el.username + ' ' + el.firstname + ' ' + el.lastname)
              .toLocaleLowerCase()
              .indexOf(this.state.input.toLocaleLowerCase()) >= 0
          );
        });
        callback(
          res.filter(item => {
            if (
              (this.props.hideUsersIds || []).indexOf(item.id) >= 0 ||
              this.state.users_ids.indexOf(item.id) >= 0 ||
              this.state.users_ids.indexOf(item) >= 0
            ) {
              return false;
            }
            return true;
<<<<<<< HEAD
          })
=======
          }),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        );
      });
    }
  }
  componentWillUpdate(nextProps, nextState) {
    this.updateStateFromProps(nextProps, false, nextState);
  }
  componentDidMount() {
    this.filter('', () => {});
  }
  renderLine(item, added, nomenu) {
    if (!item) {
      return '';
    }

    if (item.email) {
      item = item.email;
    }

    var id = item.id || item;

    var text = '';
    var button = '';

    text = <UserOrMail item={item} />;

    if (added && !this.props.readOnly) {
      if (id != UsersService.getCurrentUserId() || this.props.canRemoveMyself) {
        button = (
          <div className="more">
            <TrashIcon
              className="m-icon-small remove"
              onClick={() => {
                this.state.users_ids = this.state.users_ids.filter(id =>
<<<<<<< HEAD
                  typeof item == 'string' ? item != id : item.id != id
=======
                  typeof item == 'string' ? item != id : item.id != id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                );
                this.setState({});
                if (this.props.onUpdate) this.props.onUpdate(this.state.users_ids);
              }}
            />
          </div>
        );
      }
    } else {
      button = (
        <div className="more">
          {/*<AddIcon className="m-icon-small add" onClick={()=>{this.state.users_ids.push(item.id || this.state.input.toLocaleLowerCase()); this.setState({input: ""})}} />*/}
        </div>
      );
    }

    return [text, button];
  }
  select(item) {
    var val = (item || {}).id || this.state.input.toLocaleLowerCase().trim();
    if (!val) {
      return;
    }
    if (this.state.users_ids.indexOf(val) < 0) {
      this.state.users_ids.push(val);
      this.setState({ input: '' });
      if (this.props.onUpdate) this.props.onUpdate(this.state.users_ids);
    }
  }
  render() {
    return (
      <OutsideClickHandler
        onOutsideClick={() => {
          this.setState({ editing: false });
        }}
      >
        <div
          className={
            'userListManager menu-cancel-margin ' +
            (this.props.collapsed ? ' collapsed' : '') +
            (this.props.big ? ' big' : '') +
            (this.props.medium ? ' medium' : '') +
            (this.props.small ? ' small' : '')
          }
        >
          {this.state.users_ids.length == 0 && !this.props.noPlaceholder && (
<<<<<<< HEAD
            <div className="menu-text no-users">
              {Languages.t('components.userlistmanager.no_users', [], 'Aucun utilisateur.')}
            </div>
=======
            <div className="menu-text no-users">{Languages.t('components.userlistmanager.no_users', [], 'Aucun utilisateur.')}</div>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
          {this.state.users_ids
            .slice(0, this.props.max || 100)
            .sort((a, b) => {
              return (b.indexOf('@') > 0 ? 1 : 0) - (a.indexOf('@') > 0 ? 1 : 0);
            })
            .map(id => {
              return <div className="menu no-background">{this.renderLine(id, true)}</div>;
            })}
          {this.state.users_ids.length > (this.props.max || 100) && (
            <div className="menu no-background">
              {this.renderLine('+' + (this.state.users_ids.length - (this.props.max || 100)), true)}
            </div>
          )}

          {!this.props.readOnly && (
            <div className="menu-text add-user-input">
              {!this.state.editing && (
                <Button
                  className="small secondary-text right-margin"
                  onClick={() => this.setState({ editing: true })}
                >
<<<<<<< HEAD
                  <Icon type="plus" className="m-icon-small" />{' '}
                  {Languages.t(
                    'scenes.apps.parameters.workspace_sections.members.invite_btn',
                    [],
                    'Ajouter des utilisateurs'
                  )}
=======
                  <Icon type="plus" className="m-icon-small" /> {Languages.t('scenes.apps.parameters.workspace_sections.members.invite_btn', 
                  [], "Ajouter des utilisateurs")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                </Button>
              )}
              {!!this.state.editing && (
                <AutoComplete
                  search={[
                    (text, cb) => {
                      this.filter(text, cb);
                    },
                  ]}
                  max={[5]}
                  renderItemChoosen={[
                    item => {
                      return '';
                    },
                  ]}
                  renderItem={[
                    item => {
                      return [this.renderLine(item)];
                    },
                  ]}
                  regexHooked={[/^(.+)$/]}
                  onSelect={el => {
                    this.select(el);
                  }}
                  autoFocus
                  small
                  position={'bottom'}
<<<<<<< HEAD
                  placeholder={Languages.t(
                    'scenes.apps.parameters.workspace_sections.members.invite_btn',
                    [],
                    'Ajouter des utilisateurs'
                  )}
=======
                  placeholder={Languages.t('scenes.apps.parameters.workspace_sections.members.invite_btn', [], "Ajouter des utilisateurs")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                />
              )}

              {!!this.props.showAddMe &&
                this.state.users_ids.indexOf(UsersService.getCurrentUser().id) < 0 && (
                  <Button
                    className="small primary-text right-margin"
                    onClick={() => this.select(UsersService.getCurrentUser())}
                  >
<<<<<<< HEAD
                    <Icon type="user" className="m-icon-small" />{' '}
                    {Languages.t('components.users_picker.add_me', [], "M'ajouter")}
                  </Button>
                )}
              {!!this.props.showAddAll &&
                Object.keys(
                  WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {}
                ).length > this.state.users_ids.length &&
                Object.keys(
                  WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {}
                ).length < 20 && (
=======
                    <Icon type="user" className="m-icon-small" /> {Languages.t('components.users_picker.add_me', [], "M'ajouter")}
                  </Button>
                )}
              {!!this.props.showAddAll &&
                Object.keys(WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {})
                  .length > this.state.users_ids.length &&
                Object.keys(WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {})
                  .length < 20 && (
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  <Button
                    className="small primary-text"
                    onClick={() => {
                      Object.keys(
<<<<<<< HEAD
                        WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {}
                      ).map(id =>
                        this.select(
                          (
                            WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[
                              id
                            ] || {}
                          ).user
                        )
                      );
                    }}
                  >
                    <Icon type="users-alt" className="m-icon-small" />{' '}
                    {Languages.t(
                      'scenes.apps.parameters.workspace_sections.members.invite_all',
                      [],
                      'Ajouter tout le monde'
                    )}
=======
                        WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
                      ).map(id =>
                        this.select(
                          (
                            WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[id] ||
                            {}
                          ).user,
                        ),
                      );
                    }}
                  >
                    <Icon type="users-alt" className="m-icon-small" /> {Languages.t('scenes.apps.parameters.workspace_sections.members.invite_all', 
                    [],"Ajouter tout le monde")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  </Button>
                )}
            </div>
          )}

          {(this.props.onCancel || this.props.onChange) && (
            <div className="menu-custom" style={{ height: 40 }}>
              {this.props.onCancel && (
                <Button
<<<<<<< HEAD
                  value={Languages.t('general.cancel', [], 'Annuler')}
=======
                  value={Languages.t('general.cancel',[],"Annuler")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  className="secondary"
                  style={{ float: 'left' }}
                  onClick={() => {
                    if (this.props.onCancel) {
                      this.props.onCancel();
                    }
                    this.setState({ users_ids: this.props.users.map(item => item.id) });
                  }}
                />
              )}
              {this.props.onChange && (
                <Button
                  style={{ float: 'right' }}
<<<<<<< HEAD
                  value={
                    this.props.continueText ||
                    Languages.t('scenes.apps.messages.message.save_button', [], 'Enregistrer')
                  }
=======
                  value={this.props.continueText || Languages.t('scenes.apps.messages.message.save_button', [], 'Enregistrer')}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  onClick={() => this.props.onChange(this.state.users_ids)}
                />
              )}
            </div>
          )}
        </div>
      </OutsideClickHandler>
    );
  }
}
