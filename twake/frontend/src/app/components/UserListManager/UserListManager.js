import React, { Component } from 'react';
import UsersService from 'services/user/user.js';
import AutoComplete from 'components/AutoComplete/AutoComplete';
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
      editing: this.props.autoFocus,
    };
    this.updateStateFromProps(props, true);
  }
  componentDidMount() {
    this.setState({ editing: this.props.autoFocus });
  }
  updateStateFromProps(props, force, nextState) {
    var anti_duplicates = [];

    var user_ids = props.users
      .map(item => item.id || item)
      .filter(function (item, pos) {
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
    UsersService.search(
      text,
      {
        scope: this.props.scope,
        workspace_id: Workspaces.currentWorkspaceId,
        group_id: Workspaces.currentGroupId,
      },
      res => {
        res = res.filter(el => !!el);
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
          }),
        );
      },
    );
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

    if (item.email && !item.username) {
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
                  typeof item == 'string' ? item != id : item.id != id,
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
            <div className="menu-text no-users">
              {Languages.t('components.userlistmanager.no_users', [], 'Aucun utilisateur.')}
            </div>
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
                  <Icon type={this.props.buttonIcon || 'plus'} className="m-icon-small" />{' '}
                  {this.props.buttonText ||
                    Languages.t(
                      'scenes.apps.parameters.workspace_sections.members.invite_btn',
                      [],
                      'Ajouter des utilisateurs',
                    )}
                </Button>
              )}
              {!!this.state.editing && (
                <AutoComplete
                  search={[
                    (text, cb) => {
                      this.filter(text, cb);
                    },
                  ]}
                  max={[this.props.maxResults || 5]}
                  renderItemChoosen={[
                    item => {
                      return '';
                    },
                  ]}
                  renderItem={[
                    item => {
                      return this.renderLine(item);
                    },
                  ]}
                  regexHooked={[/^(.+)$/]}
                  onSelect={el => {
                    this.select(el);
                  }}
                  autoFocus
                  small
                  position={this.props.onTop ? 'top' : 'bottom'}
                  placeholder={
                    this.props.inputText ||
                    Languages.t(
                      'scenes.apps.parameters.workspace_sections.members.invite_btn',
                      [],
                      'Ajouter des utilisateurs',
                    )
                  }
                />
              )}

              {!!this.props.showAddMe &&
                this.state.users_ids.indexOf(UsersService.getCurrentUser().id) < 0 && (
                  <Button
                    className="small primary-text right-margin"
                    onClick={() => this.select(UsersService.getCurrentUser())}
                  >
                    <Icon type="user" className="m-icon-small" />{' '}
                    {Languages.t('components.users_picker.add_me', [], "M'ajouter")}
                  </Button>
                )}
              {!!this.props.showAddAll &&
                Object.keys(
                  WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
                ).length > this.state.users_ids.length &&
                Workspaces.getCurrentWorkspace().total_members < 30 && (
                  <Button
                    className="small primary-text"
                    onClick={() => {
                      Object.keys(
                        WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {},
                      ).map(id =>
                        this.select(
                          (
                            WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[
                              id
                            ] || {}
                          ).user,
                        ),
                      );
                    }}
                  >
                    <Icon type="users-alt" className="m-icon-small" />{' '}
                    {Languages.t(
                      'scenes.apps.parameters.workspace_sections.members.invite_all',
                      [],
                      'Ajouter tout le monde',
                    )}
                  </Button>
                )}
            </div>
          )}

          {(this.props.onCancel || this.props.onChange) && (
            <div className="menu-custom" style={{ height: 40 }}>
              {this.props.onCancel && (
                <Button
                  value={Languages.t('general.cancel', [], 'Annuler')}
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
                  value={
                    this.props.continueText ||
                    Languages.t('scenes.apps.messages.message.save_button', [], 'Enregistrer')
                  }
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
