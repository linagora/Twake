import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import uploadService from 'services/uploadManager/uploadManager.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import Input from 'components/Inputs/Input.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import './Pages.scss';

export default class WorkspaceIdentity extends Component {
  constructor() {
    super();
    var workspace = Collections.get('workspaces').find(workspaceService.currentWorkspaceId);
    this.state = {
      i18n: Languages,
      workspace: Collections.get('workspaces'),
      workspaceService: workspaceService,
      attributeOpen: 0,
      subMenuOpened: 0,
      workspaceName: workspace ? workspace.name : '',
      groupName: workspace ? workspace.group.name : '',
      workspaceLogo: workspace ? workspace.logo : '',
      deleteWorkspaceName: '',
    };
    this.inputWorkspaceName = null;
    workspaceService.addListener(this);
    Languages.addListener(this);
  }
  componentWillMount() {}
  componentWillUnmount() {
    workspaceService.removeListener(this);
    Languages.removeListener(this);
  }
  open() {
    this.fileinput.click();
  }
  changeLogo(event) {
    var that = this;
    event.preventDefault();
    uploadService.getFilesTree(event, function (tree) {
      var first = tree[Object.keys(tree)[0]];
      if (first.constructor.name != 'Object') {
        //A file
        var reader = new FileReader();
        reader.onload = function (e) {
          that.workspaceLogo.style.backgroundImage = "url('" + e.target.result + "')";
        };
        that.setState({ workspaceLogo: first });
        console.log(that.state.workspaceLogo);
        reader.readAsDataURL(first);
      }
    });
  }

  render() {
    var workspace = Collections.get('workspaces').find(workspaceService.currentWorkspaceId);
    return (
      <div className="workspaceParameter">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.title',
            [],
            "Paramètres de l'espace de travail",
          )}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.displayed_preferencies_subtitle',
              [],
              "Préférences d'affichage",
            )}
          </div>

          <Attribute
            label={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.name_label',
              [],
              "Nom de l'espace",
            )}
            description={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.name_description',
              [],
              'Modifiez le nom de cet espace de travail',
            )}
            focusOnOpen={this.inputWorkspaceName}
          >
            <div className="parameters_form">
              <Input
                medium
                refInput={node => (this.inputWorkspaceName = node)}
                className={this.state.workspaceService.errorUsernameExist ? 'error' : ''}
                type="text"
                value={this.state.workspaceName}
                onKeyDown={e => {
                  if (e.keyCode == 13) {
                    workspaceService.updateWorkspaceName(this.state.workspaceName);
                  }
                }}
                onChange={ev => this.setState({ workspaceName: ev.target.value })}
              />

              {this.state.workspaceService.errorName && (
                <span className="text error">
                  {this.state.i18n.t('scenes.login.create_account.username_already_exist')}
                </span>
              )}

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.workspaceService.loading}
                onClick={() =>
                  this.state.workspaceService.updateWorkspaceName(this.state.workspaceName)
                }
                loading={this.state.workspaceService.loading}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>

          <Attribute
            label={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.logo_subtitle',
              [],
              'Logo',
            )}
            description={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.logo_modify_description',
              [],
              "Modifiez l'image de cet espace de travail",
            )}
            focusOnOpen={this.inputWorkspaceName}
          >
            <div
              onClick={event => {
                this.fileinput.click();
              }}
            >
              <input
                ref={node => (this.fileinput = node)}
                type="file"
                style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '100px' }}
                onChange={e => this.changeLogo(e)}
              />
              <div
                ref={ref => (this.workspaceLogo = ref)}
                className={'image thumbnail ' + (this.state.workspaceLogo ? 'has_image ' : '')}
                style={{
                  backgroundImage:
                    "url('" + window.addApiUrlIfNeeded(this.state.workspaceLogo) + "')",
                }}
              >
                {((workspace.mininame || workspace.name) + '-')[0].toUpperCase()}
              </div>
            </div>
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.weight_max_small_text',
                [],
                'Poids maximum 5 mo.',
              )}
              <br />
              <a
                className="red"
                onClick={() => {
                  this.setState({ workspaceLogo: null });
                }}
              >
                {Languages.t('general.delete', [], 'Supprimer')}
              </a>
            </div>
            <div>
              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={this.state.workspaceService.loading}
                onClick={() =>
                  this.state.workspaceService.updateWorkspaceLogo(this.state.workspaceLogo)
                }
                loading={this.state.workspaceService.loading}
                value={this.state.i18n.t('general.update')}
              />
            </div>
          </Attribute>
          <Attribute
            label={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.deleteworkspace',
              [],
              "Supprimer l'espace",
            )}
            description={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.deleteworkspace_description',
              [],
              'Supprimer cet espace de travail',
            )}
            focusOnOpen={this.inputDeleteWorkspace}
          >
            <div className="parameters_form deleteSpace">
              <Input
                medium
                refInput={node => (this.inputDeleteWorkspace = node)}
                className={this.state.workspaceService.errorUsernameExist ? 'error' : ''}
                type="text"
                placeholder={
                  Languages.t('scenes.app.popup.workspaceparameter.pages.enter', [], 'Entrer ') +
                  workspace.name
                }
                value={this.state.deleteWorkspaceName}
                onChange={ev => this.setState({ deleteWorkspaceName: ev.target.value })}
              />
              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={
                  this.state.workspaceService.loading ||
                  workspace.name != this.state.deleteWorkspaceName
                }
                onClick={() => {
                  AlertManager.confirm(() => {
                    this.state.workspaceService.deleteWorkspace();
                  });
                }}
                loading={this.state.workspaceService.loading}
                value={this.state.i18n.t('general.delete')}
              />
            </div>
            {this.state.workspaceService.errorDeleteWorkspaceMember && (
              <span className="text error">
                {Languages.t(
                  'scenes.app.popup.workspaceparameter.pages.error_workspace_member',
                  [],
                  "Vous devez être seul dans l'espace de travail pour le supprimer.\nRetirez vos collaborateurs et recommencer l'opération",
                )}
              </span>
            )}
          </Attribute>
        </div>
      </div>
    );
  }
}
