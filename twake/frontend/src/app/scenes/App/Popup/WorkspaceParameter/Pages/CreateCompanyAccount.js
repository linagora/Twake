import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Input from 'components/Inputs/Input.js';
import Button from 'components/Buttons/Button.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import {ObjectModal, ObjectModalSectionTitle, ObjectModalTitle,} from 'components/ObjectModal/ObjectModal.js';
import Api from 'services/api.js';
import Workspaces from 'services/workspaces/workspaces.js';
import './Pages.scss';

export default class CreateCompanyAccount extends Component {
  constructor() {
    super();
    this.state = {
      password: '',
      fullname: '',
    };
    Languages.addListener(this);
  }
  save() {
    if (!(this.state.password || '').trim() || (this.state.password || '').length < 8) {
      return;
    }

    MediumPopupManager.closeAll();

    var data = {
      mail: this.props.email,
      fullname: this.state.fullname,
      password: this.state.password,
      language: Languages.language,
      workspace_id: Workspaces.currentWorkspaceId,
    };
    Api.post('users/subscribe/company_subscribe', data, res => {
      if ((res || {}).data == 'success') {
        AlertManager.alert(() => {}, {
          title: 'Account created',
          text: (
            <div className="allow_selection">
              <b>Login:</b> {this.props.email}
              <br />
              <b>Password:</b> {this.state.password}
              <br />
              <span className="text">
                Send this information to your member to let him now its new credentials.
              </span>
            </div>
          ),
        });
      } else {
        AlertManager.alert(() => {}, {
          title: 'An error occurred',
          text: 'Please try again.',
        });
      }
    });
  }
  render() {
    return (
      <div className="">
        <ObjectModal
          className="create_company_account_modal "
          onClose={() => MediumPopupManager.closeAll()}
          footer={
            <div>
              <Button
                className="secondary-light small right-margin"
                style={{ width: 'auto' }}
                onClick={() => {
                  MediumPopupManager.closeAll();
                }}
              >
                {Languages.t('general.cancel', [], 'Cancel')}
              </Button>

              <Button
                className="small primary"
                style={{ width: 'auto', float: 'right' }}
                onClick={() => {
                  this.save();
                }}
              >
                Save account
              </Button>
            </div>
          }
          title={
            <ObjectModalTitle>
              {this.props.edit ? 'Edit temporary account' : 'Create temporary account'}
            </ObjectModalTitle>
          }
        >
          <span className="text">
            A temporary account works like a normal Twake account, but you generate its password and
            you will be able to reset it if necessary.
            <br />
            Your user can sign in at anytime using this same email and change its temporary account
            to a normal account.
          </span>

          {!this.props.edit && [
            <ObjectModalSectionTitle icon="user" name="Fullname" />,
            <Input
              className="full_width"
              placeholder="John Snow"
              onChange={e => this.setState({ fullname: e.target.value })}
            />,
          ]}

          <ObjectModalSectionTitle icon="envelope" name="Email / Login" />
          <Input className="full_width" disabled value={this.props.email} />

          <ObjectModalSectionTitle icon="lock" name="Password" />
          <Input
            className="full_width"
            placeholder="Password for your user"
            onChange={e => this.setState({ password: e.target.value })}
          />

          <br />
          <br />
          <span className="text">Your password must contain at least 8 characters.</span>

          <br />
          <br />
        </ObjectModal>
      </div>
    );
  }
}
