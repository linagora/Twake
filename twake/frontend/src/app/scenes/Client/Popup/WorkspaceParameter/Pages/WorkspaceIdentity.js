// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';

import i18n from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections';
import workspaceService from 'services/workspaces/workspaces';
import uploadService from 'services/uploadManager/uploadManager';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout';
import Attribute from 'components/Parameters/Attribute';
import Input from 'components/Inputs/Input';
import AlertManager from 'services/AlertManager/AlertManager';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';

import './Pages.scss';

export default class WorkspaceIdentity extends Component {
  constructor() {
    super();
    var workspace = Collections.get('workspaces').find(workspaceService.currentWorkspaceId);
    this.state = {
      workspace: Collections.get('workspaces'),
      attributeOpen: 0,
      subMenuOpened: 0,
      workspaceName: workspace ? workspace.name : '',
      workspaceLogo: workspace ? workspace.logo : '',
      deleteWorkspaceName: '',
    };
    this.inputWorkspaceName = null;
    workspaceService.addListener(this);
  }
  componentWillUnmount() {
    workspaceService.removeListener(this);
  }
  open() {
    this.fileinput.click();
  }
  changeLogo(event) {
    var that = this;
    event.preventDefault();
    uploadService.getFilesTree(event, function (tree) {
      var first = tree[Object.keys(tree)[0]];
      if (first.constructor.name !== 'Object') {
        //A file
        var reader = new FileReader();
        reader.onload = function (e) {
          that.workspaceLogo.style.backgroundImage = "url('" + e.target.result + "')";
        };
        that.setState({ workspaceLogo: first });
        reader.readAsDataURL(first);
      }
    });
  }

  render() {
    var workspace = Collections.get('workspaces').find(workspaceService.currentWorkspaceId);
    return (
      <div className="workspaceParameter">
        <div className="title">
          {i18n.t(
            'scenes.app.popup.workspaceparameter.pages.title',
            [],
            "Paramètres de l'espace de travail",
          )}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {i18n.t(
              'scenes.app.popup.workspaceparameter.pages.displayed_preferencies_subtitle',
              [],
              "Préférences d'affichage",
            )}
          </div>

          <Attribute
            label={i18n.t(
              'scenes.app.popup.workspaceparameter.pages.name_label',
              [],
              "Nom de l'espace",
            )}
            description={i18n.t(
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
                className={workspaceService.errorUsernameExist ? 'error' : ''}
                type="text"
                value={this.state.workspaceName}
                onKeyDown={e => {
                  if (e.keyCode === 13) {
                    workspaceService.updateWorkspaceName(this.state.workspaceName);
                  }
                }}
                onChange={ev => this.setState({ workspaceName: ev.target.value })}
              />

              {workspaceService.errorName && (
                <span className="text error">
                  {i18n.t('scenes.login.create_account.username_already_exist')}
                </span>
              )}

              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={workspaceService.loading}
                onClick={() =>
                  workspaceService.updateWorkspaceName(this.state.workspaceName)
                }
                loading={workspaceService.loading}
                value={i18n.t('general.update')}
              />
            </div>
          </Attribute>

          <Attribute
            label={i18n.t(
              'scenes.app.popup.workspaceparameter.pages.logo_subtitle',
              [],
              'Logo',
            )}
            description={i18n.t(
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
                style={{ backgroundImage: addApiUrlIfNeeded(this.state.workspaceLogo, true) }}
              >
                {((workspace.mininame || workspace.name) + '-')[0].toUpperCase()}
              </div>
            </div>
            <div className="smalltext">
              {i18n.t(
                'scenes.app.popup.workspaceparameter.pages.weight_max_small_text',
                [],
                'Poids maximum 5 mo.',
              )}
              <br />
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                className="red"
                onClick={() => {
                  this.setState({ workspaceLogo: null });
                }}
              >
                {i18n.t('general.delete', [], 'Supprimer')}
              </a>
            </div>
            <div>
              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={workspaceService.loading}
                onClick={() =>
                  workspaceService.updateWorkspaceLogo(this.state.workspaceLogo)
                }
                loading={workspaceService.loading}
                value={i18n.t('general.update')}
              />
            </div>
          </Attribute>
          <Attribute
            label={i18n.t(
              'scenes.app.popup.workspaceparameter.pages.deleteworkspace',
              [],
              "Supprimer l'espace",
            )}
            description={i18n.t(
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
                className={workspaceService.errorUsernameExist ? 'error' : ''}
                type="text"
                placeholder={
                  i18n.t('scenes.app.popup.workspaceparameter.pages.enter', [], 'Entrer ') +
                  workspace.name
                }
                value={this.state.deleteWorkspaceName}
                onChange={ev => this.setState({ deleteWorkspaceName: ev.target.value })}
              />
              <ButtonWithTimeout
                className="small buttonValidation"
                disabled={
                  workspaceService.loading ||
                  workspace.name !== this.state.deleteWorkspaceName
                }
                onClick={() => {
                  AlertManager.confirm(() => {
                    workspaceService.deleteWorkspace();
                  });
                }}
                loading={workspaceService.loading}
                value={i18n.t('general.delete')}
              />
            </div>
            {workspaceService.errorDeleteWorkspaceMember && (
              <span className="text error">
                {i18n.t(
                  'scenes.app.popup.workspaceparameter.pages.error_workspace_member',
                  [],
                  'You must be alone in the workspace to remove it. Remove your collaborators and try again.',
                )}
              </span>
            )}
          </Attribute>
        </div>
      </div>
    );
  }
}
