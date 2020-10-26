import React, { Component } from 'react';

import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Emojione from 'components/Emojione/Emojione';
import Languages from 'services/languages/languages.js';
import popupManager from 'services/popupManager/popupManager.js';
import Strings from 'services/utils/strings.js';
import InputWithButton from 'components/Inputs/InputWithButton.js';
import workspacesUsersService from 'services/workspaces/workspaces_users.js';
import './AddUser.scss';
import InputWithIcon from 'app/components/Inputs/InputWithIcon';

type Props = {
  standalone: boolean;
  inline: boolean;
  onChange: (members: any) => any;
  previous: () => void;
  finish: () => void;
  loading: boolean;
};

type State = {
  i18n: any;
  workspacesUsersService: any;
  members: string[];
  collaborators: number;
  willClose: boolean;
  multi: boolean;
  entry: string;
  all_import: string;
  all_externes: any;
  input_values: string[];
};

export default class AddUser extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      i18n: Languages,
      workspacesUsersService: workspacesUsersService,
      members: [],
      collaborators: 0,
      willClose: false,
      multi: false,
      entry: '',
      all_import: '',
      all_externes: '',
      input_values: [''],
    };

    workspacesUsersService.addListener(this);
    Languages.addListener(this);
  }

  componentWillUnmount() {
    workspacesUsersService.removeListener(this);
    Languages.removeListener(this);
  }

  getUserOrMail(str: string) {
    if (Strings.verifyMail(str)) {
      return str;
    } else {
      return str
        .toLocaleLowerCase()
        .replace(/[^a-zA-Z0-9-_\.]/g, '')
        .replace(/^@*(.*)/, '@$1');
    }
  }

  finish() {
    if (this.props.standalone) {
      workspacesUsersService.addUser(
        this.state.members,
        () => {
          this.close();
        },
        null,
      );
    } else if (this.props.finish) {
      this.props.finish();
      this.close();
    }
  }

  close() {
    if (this.props.inline) {
      return;
    }
    this.setState({ willClose: true });
    setTimeout(() => {
      popupManager.close();
    }, 200);
  }

  stringToArray(str: string) {
    let regex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gm;
    let mailToArray: string[] = [];
    const stringToArray = str.match(regex);

    (stringToArray || []).map((item: any) => mailToArray.push(item.toLocaleLowerCase()));

    const members = mailToArray.filter((elem, index, self) => index === self.indexOf(elem));

    if (this.props.onChange) this.props.onChange(members);
    this.setState({
      members: members,
    });
  }

  setTemporaryInputs(index: number, type?: string, str?: string) {
    let arr: string[] = [...this.state.input_values];
    if (type === 'add') {
      arr.push('');
    }
    if (type === 'modify') {
      arr[index] = str === undefined ? '' : str;
    }
    if (type === 'remove') {
      if (arr.length > 1) {
        arr.splice(index, 1);
      }
    }

    this.stringToArray(arr.join(' '));
    this.setState({ input_values: arr });
  }

  getCurrentButtonState() {
    if (this.state && this.state.members.length === 0) {
      return 'scenes.apps.parameters.group_sections.managers.invite_manager_button_skip';
    } else {
      return 'general.add';
    }
  }

  isLastInput(index: number, inputToShow: number) {
    return inputToShow === index + 1 ? true : false;
  }

  closeInput(index: number) {
    console.log(this.state.input_values[index]);
  }

  setInputs() {
    let arr: any[] = [];
    for (let i = 0; i < this.state.input_values.length && i < 5; i++) {
      arr.push(
        <div key={'input-' + i} className=" small-y-margin">
          <InputWithButton
            color="danger"
            icon={'trash'}
            autoFocus
            onChange={(e: { target: { value: string } }) => {
              this.setTemporaryInputs(i, 'modify', e.target.value);
            }}
            placeholder={Languages.t('scenes.app.popup.adduser.placeholder_input')}
            value={this.state.input_values[i]}
            btnAction={() => this.setTemporaryInputs(i, 'remove')}
            className="full_width"
            onEnter={() => {
              if (this.state.input_values.length < 5) return this.setTemporaryInputs(0, 'add');
            }}
          />
        </div>,
      );
    }

    return arr;
  }
  render() {
    var content = (
      <div className={this.props.inline ? '' : 'addUserView'}>
        <div className="subtitle bottom-margin">
          {this.state.i18n.t('scenes.app.workspaces.create_company.invitations.title_2')}{' '}
          <Emojione type=":upside_down:" />
        </div>

        {this.state.multi && (
          <div>
            <AutoHeight
              minHeight="100px"
              maxHeight="300px"
              value={this.state.all_import}
              onChange={(e: { target: { value: string } }) => {
                this.setState({ all_import: e.target.value });
                this.stringToArray(e.target.value);
              }}
              placeholder={'james@acme.com, jane@acme.com'}
            />

            <br />
            <div className="smalltext small-top-margin" style={{ fontWeight: 'bold' }}>
              {Languages.t('scenes.app.popup.adduser.current_mail_state', [
                this.state.members.length || 0,
              ])}
            </div>
            <br />

            <div className="smalltext" style={{ opacity: 0.5 }}>
              {Languages.t('scenes.app.popup.adduser.adresses_message')}
            </div>

            <a
              className="smalltext"
              onClick={() => {
                this.setState({ multi: false });
              }}
            >
              {Languages.t('scenes.app.popup.adduser.message_instruction')}
            </a>
          </div>
        )}
        {!this.state.multi && (
          <div>
            {this.setInputs()}

            <div className="adduser-container y-margin">
              <div className="smalltext">
                {this.state.input_values.length < 5 ? (
                  <a onClick={() => this.setTemporaryInputs(0, 'add')}>
                    {Languages.t('scenes.app.popup.adduser.add_another_mail')}
                  </a>
                ) : (
                  ''
                )}
              </div>

              <div className="smalltext" style={{ fontWeight: 'bold' }}>
                {Languages.t('scenes.app.popup.adduser.current_mail_state', [
                  this.state.members.length || 0,
                ])}
              </div>
            </div>

            <div className="smalltext" style={{ opacity: 0.5 }}>
              {this.state.i18n.t(
                'scenes.app.workspaces.create_company.invitations.auto_add_inputs_info',
              )}
            </div>

            <a
              className="smalltext"
              onClick={() => {
                this.setState({ multi: true });
              }}
            >
              {Languages.t('scenes.app.popup.adduser.adding_several_people')}
            </a>
          </div>
        )}

        <div className="bottom">
          {this.props.inline && (
            <a
              className="returnBtn blue_link"
              onClick={() => this.props.previous && this.props.previous()}
            >
              {this.state.i18n.t('general.back')}
            </a>
          )}
          <ButtonWithTimeout
            className="medium"
            disabled={this.state.workspacesUsersService.loading || this.props.loading}
            onClick={() => {
              this.finish();
            }}
            value={Languages.t(this.getCurrentButtonState())}
            loading={this.state.workspacesUsersService.loading || this.props.loading}
            loadingTimeout={1500}
          />
        </div>
      </div>
    );

    if (!this.props.inline) {
      content = (
        <div className={'addUserView'}>
          <div
            className={
              'center_box_container login_view ' +
              (this.state.willClose ? 'fade_out ' : 'skew_in_bottom ')
            }
          >
            <div className="center_box ">{content}</div>
          </div>
        </div>
      );
    }

    return content;
  }
}
