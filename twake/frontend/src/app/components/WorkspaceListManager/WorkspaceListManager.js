import React, { Component } from 'react';
import Collections from 'services/Collections/Collections.js';
import AutoComplete from 'components/AutoComplete/AutoComplete';
import Workspaces from 'services/workspaces/workspaces.js';
import TrashIcon from '@material-ui/icons/DeleteOutlined';
import Button from 'components/Buttons/Button.js';
import Icon from 'components/Icon/Icon.js';
import OutsideClickHandler from 'react-outside-click-handler';
import './WorkspaceListManager.scss';
import Languages from 'services/languages/languages.js';

export default class WorkspaceListManager extends React.Component {
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

    var workspace_ids = props.workspaces
      .map(item => item.id || item)
      .filter(function (item, pos) {
        var here = anti_duplicates.indexOf(item) < 0;
        anti_duplicates.push(item);
        return here;
      });

    if (force || JSON.stringify(workspace_ids) != this.savedUserProps) {
      this.state.workspaces_ids = workspace_ids;
      if (nextState) {
        nextState.workspaces_ids = workspace_ids;
      }
      this.savedUserProps = JSON.stringify(workspace_ids);
    }
  }
  filter(text, callback) {
    this.state.input = text;

    text = (text || '').toLocaleLowerCase();

    var result = [];
    var added_groups = [];
    Object.keys(Workspaces.user_workspaces || {}).forEach(id => {
      var workspace = Collections.get('workspaces').find(id);
      if (
        workspace &&
        ((workspace.name || '').toLocaleLowerCase().indexOf(text) >= 0 ||
          ((workspace.group || {}).name || '').toLocaleLowerCase().indexOf(text) >= 0)
      ) {
        result.push({ id: id, group_id: (workspace.group || {}).id });

        if ((workspace.group || {}).id && added_groups.indexOf(workspace.group.id) < 0) {
          added_groups.push(workspace.group.id);
          result.push({ id: workspace.group.id, group_id: workspace.group.id });
        }
      }
    });

    result = result
      .filter(a => (this.state.workspaces_ids || []).indexOf(a.id) < 0)
      .sort((a, b) => {
        if (a.group_id == b.group_id) {
          if (a.group_id == a.id) {
            return -1;
          } else {
            return 1;
          }
        }
        return (a.group_id || '').localeCompare(b.group_id || '');
      });

    callback(result);
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

    console.log(item);

    var id = item.id;

    var group = Collections.get('groups').find(id);
    var workspace = null;
    var type = '(company)';
    if (!group) {
      workspace = Collections.get('workspaces').find(id);
      if (!workspace) {
        return '';
      }
      group = workspace.group;
      type = '(workspace)';
    }

    var text = (
      <div className="text">
        {group.name + (workspace ? ' • ' + workspace.name : '')} {type}
      </div>
    );

    var button = undefined;

    if (added && !this.props.readOnly) {
      button = (
        <div className="more">
          <TrashIcon
            className="m-icon-small remove"
            onClick={() => {
              this.state.workspaces_ids = this.state.workspaces_ids.filter(id =>
                typeof item == 'string' ? item != id : item.id != id,
              );
              this.setState({});
              if (this.props.onUpdate) this.props.onUpdate(this.state.workspaces_ids);
            }}
          />
        </div>
      );
    }

    return [text, button];
  }

  select(workspace_or_group_id) {
    if (Collections.get('groups').find(workspace_or_group_id)) {
      Workspaces.getOrderedWorkspacesInGroup(workspace_or_group_id).forEach(item => {
        this.select(item.id);
      });
      return;
    }

    var val = workspace_or_group_id;
    if (!val) {
      return;
    }

    if (this.state.workspaces_ids.indexOf(val) < 0) {
      this.state.workspaces_ids.push(val);
      this.setState({ input: '' });
      if (this.props.onUpdate) this.props.onUpdate(this.state.workspaces_ids);
    }
  }

  render() {
    var all_workspaces =
      this.state.workspaces_ids.length == 0 ||
      Object.keys(Workspaces.user_workspaces || {}).length <= this.state.workspaces_ids.length;

    return (
      <OutsideClickHandler
        onOutsideClick={() => {
          this.setState({ editing: false });
        }}
      >
        <div
          className={
            'workspaceListManager' +
            (this.props.collapsed ? ' collapsed' : '') +
            (this.props.big ? ' big' : '') +
            (this.props.medium ? ' medium' : '') +
            (this.props.small ? ' small' : '')
          }
        >
          {all_workspaces && !this.props.noPlaceholder && (
            <div className="menu-text no-workspaces">
              {Languages.t(
                'components.workspace.list_manager.no_workspace',
                [],
                'Aucun espace de travail.',
              )}
            </div>
          )}
          {!all_workspaces &&
            this.state.workspaces_ids.map(id => {
              return <div className="menu no-background">{this.renderLine({ id: id }, true)}</div>;
            })}

          {!this.props.readOnly && (
            <div className="menu-text add-user-input">
              {!this.state.editing && (
                <Button
                  className="small secondary-text right-margin"
                  onClick={() => this.setState({ editing: true })}
                >
                  <Icon type="plus" className="m-icon-small" />{' '}
                  {this.props.addText ||
                    Languages.t(
                      'components.workspace.list_manager.add',
                      [],
                      'Ajouter des espaces de travail',
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
                    this.select(el.id);
                  }}
                  autoFocus
                  small
                  position={'bottom'}
                  placeholder={Languages.t(
                    'scenes.apps.parameters.workspace_sections.members.invite_btn',
                    [],
                    'Ajouter des utilisateurs',
                  )}
                />
              )}

              {!!this.props.showAddCurrentWorkspace &&
                this.state.workspaces_ids.indexOf(Workspaces.currentWorkspaceId) < 0 && (
                  <Button
                    className="small primary-text right-margin"
                    onClick={() => this.select(Workspaces.currentWorkspaceId)}
                  >
                    <Icon type="suitcase-alt" className="m-icon-small" />{' '}
                    {Languages.t(
                      'components.workspace.list_manager.current_space',
                      [],
                      'Espace courant',
                    )}
                  </Button>
                )}
              {!!this.props.showAddCurrentGroup &&
                Workspaces.getOrderedWorkspacesInGroup(Workspaces.currentGroupId).filter(
                  item => this.state.workspaces_ids.indexOf(item.id) < 0,
                ).length > 0 &&
                this.state.workspaces_ids.indexOf(Workspaces.currentGroupId) < 0 && (
                  <Button
                    className="small primary-text right-margin"
                    onClick={() => this.select(Workspaces.currentGroupId)}
                  >
                    <Icon type="building" className="m-icon-small" />{' '}
                    {Languages.t(
                      'components.workspace.list_manager.current_company',
                      [],
                      'Entreprise courante',
                    )}
                  </Button>
                )}
              {!!this.props.showAddAll &&
                Object.keys(Workspaces.user_workspaces || {}).length >
                  this.state.workspaces_ids.length &&
                this.state.workspaces_ids.length > 0 && (
                  <Button
                    className="small primary-text"
                    onClick={() => {
                      Object.keys(Workspaces.user_workspaces || {}).map(id => this.select(id));
                    }}
                  >
                    <Icon type="workspaces-alt" className="m-icon-small" />{' '}
                    {Languages.t('components.workspace.list_manager.all', [], 'Tous')}
                  </Button>
                )}
            </div>
          )}
        </div>
      </OutsideClickHandler>
    );
  }
}
