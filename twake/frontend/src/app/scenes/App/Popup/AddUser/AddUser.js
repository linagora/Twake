import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import workspacesUsersService from 'services/workspaces/workspaces_users.js';
import popupManager from 'services/popupManager/popupManager.js';
import Emojione from 'components/Emojione/Emojione.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Switch from 'components/Inputs/Switch.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import Input from 'components/Inputs/Input.js';
import './AddUser.scss';

export default class AddUser extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspacesUsersService: workspacesUsersService,
      members: [],
      collaborators: 0,
      input_to_show: 2,
      willClose: false,
      multi: false,
    };
    for (var i = 0; i < 5; i++) {
      this.state.members.push({ mail: '', externe: '0' });
    }

    workspacesUsersService.addListener(this);
    Languages.addListener(this);
  }
  componentWillUnmount() {
    workspacesUsersService.removeListener(this);
    Languages.removeListener(this);
  }
  componentDidMount(prevProps, prevState, snapshot) {
    if (this.input) {
      this.input.focus();
    }
  }
  onChangeMail(values, member_index) {
    if (values.mail !== undefined) {
      this.state.members[member_index].mail = values.mail;
    }
    if (values.externe !== undefined) {
      this.state.members[member_index].externe = values.externe;
    }

    var that = this;
    var notEmpty = false;
    that.state.collaborators = 0;
    this.state.members.forEach(function (member, i) {
      if (member.mail.length > 0) {
        notEmpty = true;
        that.state.input_to_show = i + 1;
        that.state.collaborators++;
      }
    });
    if (!notEmpty) {
      that.state.input_to_show = 1;
    }
    this.state.input_to_show = Math.max(2, this.state.input_to_show + 1);

    this.setState({});

    if (this.props.onChange) {
      this.props.onChange(this.getMembers());
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
  finish() {
    if (this.props.standalone) {
      workspacesUsersService.addUser(this.getMembers(), () => {
        this.close();
      });
    } else if (this.props.finish) {
      this.props.finish();
      this.close();
    }
  }
  getMembers() {
    if (this.state.multi) {
      return this.state.all_import
        .split(',')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim() + '|' + (this.state.all_externes || '0'));
    } else {
      return this.state.members
        .filter(item => item && item.mail && item.mail.trim().length > 0)
        .map(item => item.mail + '|' + (item.externe || '0'));
    }
  }
  render() {
    var mail_inputs = 0;
    var last_not_empty = 0;
    var content = (
      <div className={this.props.inline ? '' : 'addUserView'}>
        <div className="subtitle bottom-margin">
          {this.state.i18n.t('scenes.app.workspaces.create_company.invitations.title_2')}{' '}
          <Emojione type=":upside_down:" />
        </div>

        {this.state.multi && (
          <div>
            <AutoHeight
              big
              value={this.state.all_import}
              onChange={e => {
                this.setState({ all_import: e.target.value });
              }}
              style={{ minHeight: 100, marginTop: 0, maxHeight: '50vh' }}
              placeholder={'james@acme.com, jane@acme.com'}
            />

            {/*<br/>

                  <Switch label={"Tous comme invités"} value={this.state.all_externes == "1"} onChange={(state)=>{this.setState({all_externes: state?"1":"0"})}} />*/}

            <br />
            <br />

            <div className="smalltext" style={{ opacity: 0.5 }}>
              {Languages.t(
                'scenes.app.popup.adduser.adresses_message',
                [],
                "Veuillez séparer les adresses par une virgule. N'oubliez pas que Twake peut limiter le nombre d'invitation en fonction de votre abonnement.",
              )}
            </div>

            <a
              className="smalltext"
              onClick={() => {
                this.setState({ multi: false });
              }}
            >
              {Languages.t(
                'scenes.app.popup.adduser.message_instruction',
                [],
                'Utiliser le formulaire classique',
              )}
            </a>
          </div>
        )}
        {!this.state.multi && (
          <div>
            {this.state.members.map((item, index) => {
              if (mail_inputs < this.state.input_to_show) {
                mail_inputs++;
                return (
                  <div className="new_member bottom-margin">
                    <Input
                      refInput={ref => {
                        if (index == 0) {
                          this.input = ref;
                        }
                      }}
                      value={item.mail}
                      key={'addMembers-' + index}
                      placeholder={this.state.i18n.t(
                        'scenes.app.workspaces.create_company.invitations.input_placeholder',
                      )}
                      onChange={e => this.onChangeMail({ mail: e.target.value }, index)}
                      onKeyDown={e => {
                        if (e.keyCode == 13) {
                          this.finish();
                        }
                      }}
                      className="full_width medium"
                    />
                  </div>
                );
              }
            })}
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
              {Languages.t(
                'scenes.app.popup.adduser.adding_several_people',
                [],
                'Ajouter plusieurs personnes à la fois',
              )}
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
            value={
              !(
                ((this.state.members || []).map(item => (item || {}).mail || '').join('').length >
                  0 &&
                  !this.state.multi) ||
                (this.state.all_import && this.state.multi)
              )
                ? this.state.i18n.t(
                    'scenes.apps.parameters.group_sections.managers.invite_manager_button_skip',
                    'Skip',
                  )
                : this.state.i18n.t(
                    'scenes.apps.parameters.group_sections.managers.invite_manager_button',
                  )
            }
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
