<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Languages from 'services/languages/languages.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import GroupService from 'services/workspaces/groups.js';
import popupManager from 'services/popupManager/popupManager.js';
import Emojione from 'components/Emojione/Emojione.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser.js';
import Input from 'components/Inputs/Input.js';
import './CreateWorkspacePage.scss';

export default class CreateWorkspacePage extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspaces: WorkspaceService,
      page: 1,
      name: '',
      members: [],
      willClose: false,
    };
    Languages.addListener(this);
    WorkspaceService.addListener(this);
  }
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    WorkspaceService.removeListener(this);
  }
  displayStep() {
    if (this.state.page == 1) {
      return (
        <div className="">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.createworkspacepage.add_subtitle',
              [],
<<<<<<< HEAD
              'Besoin de plus de place ? Un nouvel espace de travail et ce sera parfait !'
=======
              'Besoin de plus de place ? Un nouvel espace de travail et ce sera parfait !',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}{' '}
            <Emojione type=":grin:" />
          </div>
          <br />
          <Input
            refInput={ref => {
              this.input = ref;
            }}
            className="full_width"
            big
            onKeyDown={e => {
              if (e.keyCode == 13 && this.state.name.length > 0) {
                this.next();
              }
            }}
            placeholder={Languages.t(
              'scenes.app.popup.createworkspacepage.placeholder_name',
              [],
<<<<<<< HEAD
              "Nom de l'espace de travail"
=======
              "Nom de l'espace de travail",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            value={this.state.name}
            onChange={evt => this.setState({ name: evt.target.value })}
          />
          <div className="bottom">
            <a className="returnBtn blue_link" onClick={() => this.previous()}>
              {this.state.i18n.t('general.back')}
            </a>
            <ButtonWithTimeout
              className="medium"
              disabled={this.state.name.length <= 0 || this.state.workspaces.loading}
              onClick={() => this.next()}
              loading={this.state.workspaces.loading}
              value={this.state.i18n.t('general.continue')}
            />
          </div>
        </div>
      );
    }
    if (this.state.page == 2) {
      return (
        <AddUser
          inline
          onChange={members => this.setState({ members: members })}
          previous={() => this.previous()}
          finish={() => this.next()}
          loading={this.state.workspaces.loading}
        />
      );
    }
  }
  previous() {
    if (this.state.page <= 1) {
      popupManager.close();
    } else {
      this.setState({ page: this.state.page - 1 });
    }
  }
  next() {
    if (this.state.page >= 2) {
      WorkspaceService.createWorkspace(
        this.state.name,
        this.state.members,
<<<<<<< HEAD
        GroupService.currentGroupId
=======
        GroupService.currentGroupId,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
      );
    } else {
      this.setState({ page: this.state.page + 1 });
    }
  }
  close() {
    this.setState({ willClose: true });
    setTimeout(() => {
      WorkspaceService.closeCreateWorkspacePage();
    }, 200);
  }
  render() {
    return (
      <div className={'createWorkspaceView'}>
        <div
          className={
            'center_box_container login_view ' +
            (this.state.willClose ? 'fade_out ' : 'skew_in_bottom ')
          }
        >
          <div className="center_box ">
            {/*<StepCounter total={1} current={this.state.page} />*/}
            <div className="title">
              {Languages.t(
                'scenes.app.popup.createworkspacepage.create_new_workspace',
                [],
<<<<<<< HEAD
                'Créer un nouvel espace de travail'
=======
                'Créer un nouvel espace de travail',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
              {/* {this.state.page}/1*/}
            </div>
            {this.displayStep()}
          </div>
        </div>
      </div>
    );
  }
}
