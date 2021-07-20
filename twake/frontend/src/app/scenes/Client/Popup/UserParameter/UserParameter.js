import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import LoginService from 'services/login/login.js';
import loginService from 'services/login/login.js';
import popupManager from 'services/popupManager/popupManager.js';
import userService from 'services/user/UserService';
import currentUserService from 'app/services/user/CurrentUser';
import uploadService from 'services/uploadManager/uploadManager.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import Notifications from './Pages/Notifications';
import MenuList from 'components/Menus/MenuComponent.js';
import './UserParameter.scss';
import Input from 'components/Inputs/Input.js';

export default class UserParameter extends Component {
  constructor(props) {
    super(props);
    var user = Collections.get('users').find(userService.getCurrentUserId());
    this.state = {
      login: LoginService,
      i18n: Languages,
      users_repository: Collections.get('users'),
      loginService: loginService,
      currentUserService: currentUserService,
      page: popupManager.popupStates['user_parameters'] || props.defaultPage || 1,
      attributeOpen: 0,
      subMenuOpened: 0,
      username: user ? user.username : '',
      lastname: user ? user.lastname : '',
      firstname: user ? user.firstname : '',
      thumbnail: false,
    };
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [
      Collections.get('users').find(userService.getCurrentUserId()).front_id,
    ]);
    LoginService.addListener(this);
    Languages.addListener(this);
    currentUserService.addListener(this);
  }
  componentWillMount() {
    this.setState({ thumbnail: false });
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
    currentUserService.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  open() {
    this.fileinput.click();
  }
  changeThumbnail(event) {
    var that = this;
    event.preventDefault();
    uploadService.getFilesTree(event, function (tree) {
      var first = tree[Object.keys(tree)[0]];
      if (first.constructor.name !== 'Object') {
        //A file
        var reader = new FileReader();
        reader.onload = function (e) {
          that.thumbnail.style.backgroundImage = "url('" + e.target.result + "')";
        };
        that.setState({ thumbnail: first });
        reader.readAsDataURL(first);
      }
    });
  }
  canEditAccount() {
    return (
      this.state.currentUserService.get().identity_provider !== 'openid' &&
      this.state.currentUserService.get().identity_provider !== 'cas'
    );
  }
  displayScene() {
    if (this.state.page === 1) {
      return (
        <form className="" autocomplete="off">
          <div className="title">{this.state.i18n.t('scenes.apps.account.title')}</div>

          {this.canEditAccount() && (
            <div className="group_section">
              <div className="subtitle">{this.state.i18n.t('scenes.apps.account.identity')}</div>

              <Attribute
                label={this.state.i18n.t('scenes.apps.account.identity')}
                description={this.state.i18n.t('scenes.apps.account.identity.description')}
              >
                <div className="parameters_form thumbnail_container" style={{ paddingTop: 16 }}>
                  <div
                    onClick={event => {
                      this.fileinput.click();
                    }}
                  >
                    <input
                      ref={node => (this.fileinput = node)}
                      type="file"
                      style={{
                        position: 'absolute',
                        top: '-10000px',
                        left: '-10000px',
                        width: '100px',
                      }}
                      onChange={e => this.changeThumbnail(e)}
                    />
                    <div
                      ref={ref => (this.thumbnail = ref)}
                      className="thumbnail"
                      style={{
                        'background-image':
                          "url('" +
                          userService.getThumbnail(
                            Collections.get('users').find(userService.getCurrentUserId()),
                          ) +
                          "')",
                      }}
                    />
                  </div>
                  <div className="smalltext">
                    {this.state.i18n.t('scenes.apps.account.thumbnail.max_weight')}
                    <br />
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a
                      className="red"
                      href="#"
                      onClick={() => {
                        this.setState({ thumbnail: 'null' });
                        currentUserService.updateidentity(
                          this.state.lastname,
                          this.state.firstname,
                          'null',
                        );
                      }}
                    >
                      {this.state.i18n.t('general.remove')}
                    </a>
                  </div>
                </div>
                <div className="parameters_form" style={{ paddingTop: 16 }}>
                  <Input
                    placeholder={this.state.i18n.t('scenes.apps.account.account.firstname')}
                    className={
                      'name ' + (this.state.currentUserService.errorUsernameExist ? 'error' : '')
                    }
                    type="text"
                    value={this.state.firstname}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updateidentity(
                          this.state.lastname,
                          this.state.firstname,
                          this.state.thumbnail,
                        );
                      }
                    }}
                    onChange={ev => this.setState({ firstname: ev.target.value })}
                  />
                  <Input
                    placeholder={this.state.i18n.t('scenes.apps.account.account.lastname')}
                    className={
                      'name ' + (this.state.currentUserService.errorUsernameExist ? 'error' : '')
                    }
                    type="text"
                    value={this.state.lastname}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updateidentity(
                          this.state.lastname,
                          this.state.firstname,
                          this.state.thumbnail,
                        );
                      }
                    }}
                    onChange={ev => this.setState({ lastname: ev.target.value })}
                  />
                  <ButtonWithTimeout
                    href="#"
                    className="small buttonValidation"
                    disabled={this.state.currentUserService.loading}
                    onClick={() =>
                      currentUserService.updateidentity(
                        this.state.lastname,
                        this.state.firstname,
                        this.state.thumbnail,
                      )
                    }
                    loading={this.state.currentUserService.loading}
                    value={this.state.i18n.t('general.update')}
                  />
                </div>
              </Attribute>
            </div>
          )}

          <div className="group_section">
            <div className="subtitle">{this.state.i18n.t('scenes.apps.account.preference')}</div>

            <Attribute
              label={this.state.i18n.t('scenes.apps.account.languages.menu_title')}
              description={this.state.i18n.t('scenes.apps.account.languages.text')}
            >
              <div className="parameters_form">
                <select
                  value={this.state.i18n.language}
                  onChange={ev => Languages.setLanguage(ev.target.value)}
                >
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ja">日本語</option>
                  <option value="ru">Русский</option>
                </select>
              </div>
            </Attribute>
          </div>

          {this.canEditAccount() && (
            <div className="group_section">
              <div className="subtitle">
                {this.state.i18n.t('scenes.apps.account.account.menu_title')}
              </div>

              <Attribute
                label={this.state.i18n.t('scenes.apps.account.account.username')}
                description={this.state.i18n.t('scenes.apps.account.account.change_username')}
              >
                <div className="parameters_form">
                  <Input
                    className={this.state.currentUserService.errorUsernameExist ? 'error' : ''}
                    type="text"
                    value={this.state.username}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updateUserName(this.state.username);
                      }
                    }}
                    onChange={ev => this.setState({ username: ev.target.value })}
                  />

                  {this.state.currentUserService.errorUsernameExist && (
                    <span className="text error">
                      {this.state.i18n.t('scenes.login.create_account.username_already_exist')}
                    </span>
                  )}

                  <ButtonWithTimeout
                    href="#"
                    className="small buttonValidation"
                    disabled={this.state.currentUserService.loading}
                    onClick={() => currentUserService.updateUserName(this.state.username)}
                    loading={this.state.currentUserService.loading}
                    value={this.state.i18n.t('general.update')}
                  />
                </div>
              </Attribute>

              <Attribute
                label={this.state.i18n.t('scenes.apps.account.account.emails')}
                description={this.state.i18n.t('scenes.apps.account.account.emails.description')}
              >
                <div className="parameters_form mails_container">
                  {Collections.get('users')
                    .find(userService.getCurrentUserId())
                    .mails.map(mail => {
                      return (
                        <div className="mail">
                          <div className="address">{mail.email}</div>
                          {mail.main && (
                            <div className="main_mail">
                              {this.state.i18n.t('scenes.apps.account.account.main_email')}
                            </div>
                          )}
                          {!mail.main && (
                            // eslint-disable-next-line jsx-a11y/anchor-is-valid
                            <a
                              className={currentUserService.loading ? 'isDisabled' : ''}
                              onClick={() => currentUserService.makeMainMail(mail.id)}
                            >
                              {this.state.i18n.t('scenes.apps.account.account.make_main')}
                            </a>
                          )}
                          {!mail.main && (
                            // eslint-disable-next-line jsx-a11y/anchor-is-valid
                            <a
                              className={'red ' + (currentUserService.loading ? 'isDisabled' : '')}
                              onClick={() => currentUserService.removeMail(mail.id)}
                            >
                              {this.state.i18n.t('general.remove')}
                            </a>
                          )}
                        </div>
                      );
                    })}

                  {this.state.subMenuOpened < 1 && (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a href="#" onClick={() => this.setState({ subMenuOpened: 1 })}>
                      {this.state.i18n.t('scenes.app.workspaces.welcome_page.add_secondary_emails')}
                    </a>
                  )}

                  {this.state.subMenuOpened >= 1 && (
                    <div className="parameters_form new_secondary_mail">
                      <Input
                        disabled={this.state.subMenuOpened === 2}
                        className={
                          'new_mail_input' +
                          (this.state.subMenuOpened === 1 &&
                          this.state.loginService.error_secondary_mail_already
                            ? 'error'
                            : '')
                        }
                        type="text"
                        onKeyDown={e => {
                          if (e.keyCode === 13 && this.state.mail.length > 0) {
                            this.state.loginService.addNewMail(
                              this.state.mail,
                              thot => thot.setState({ subMenuOpened: 2 }),
                              this,
                            );
                          }
                        }}
                        placeholder={this.state.i18n.t(
                          'scenes.app.workspaces.welcome_page.new_email',
                        )}
                        value={this.state.mail}
                        onChange={evt => this.setState({ mail: evt.target.value })}
                      />
                      {this.state.subMenuOpened === 1 &&
                        this.state.loginService.error_secondary_mail_already && (
                          <span id="errorUsernameExist" className={'text error'}>
                            {this.state.i18n.t('scenes.login.create_account.email_used')}
                          </span>
                        )}

                      {this.state.subMenuOpened === 2 && (
                        <Input
                          type="text"
                          onKeyDown={e => {
                            if (e.keyCode === 13 && this.state.code.length > 0) {
                              this.state.loginService.verifySecondMail(
                                this.state.mail,
                                this.state.code,
                                thot => {
                                  thot.setState({ subMenuOpened: 0, mail: '', code: '' });
                                },
                                this,
                              );
                            }
                          }}
                          placeholder={'123-456-789'}
                          onChange={evt => this.setState({ code: evt.target.value })}
                          className={
                            'new_mail_input_code' +
                            (this.state.loginService.error_code || this.state.error_code
                              ? 'error'
                              : '')
                          }
                          style={{ maxWidth: '200px', textAlign: 'center', marginTop: 10 }}
                        />
                      )}
                      {this.state.subMenuOpened === 2 &&
                        (this.state.loginService.error_code || this.state.error_code) && (
                          <span
                            id="errorUsernameExist"
                            className={'text error'}
                            style={{ display: 'block' }}
                          >
                            {this.state.i18n.t(
                              'scenes.apps.account.account.email_add_modal.invalid_code',
                            )}
                          </span>
                        )}

                      {this.state.subMenuOpened === 1 && (
                        <div className="form_bottom">
                          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                          <a
                            href="#"
                            className="cancel"
                            onClick={() => this.setState({ subMenuOpened: 0 })}
                          >
                            {this.state.i18n.t('general.cancel')}
                          </a>
                          <ButtonWithTimeout
                            href="#"
                            className="small buttonValidation"
                            disabled={this.state.loginService.loading}
                            onClick={() =>
                              this.state.loginService.addNewMail(
                                this.state.mail,
                                thot => thot.setState({ subMenuOpened: 2 }),
                                this,
                              )
                            }
                            value={this.state.i18n.t(
                              'scenes.app.workspaces.welcome_page.add_new_email',
                            )}
                            loading={this.state.loginService.loading}
                            loadingTimeout={1500}
                          />
                        </div>
                      )}
                      {this.state.subMenuOpened === 2 && (
                        <div className="form_bottom">
                          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                          <a
                            href="#"
                            className="cancel"
                            onClick={() => this.setState({ subMenuOpened: 0 })}
                          >
                            {this.state.i18n.t('general.cancel')}
                          </a>
                          <ButtonWithTimeout
                            href="#"
                            className="small buttonValidation"
                            disabled={this.state.loginService.loading}
                            onClick={() =>
                              this.state.loginService.verifySecondMail(
                                this.state.mail,
                                this.state.code,
                                thot => {
                                  thot.setState({ subMenuOpened: 0, mail: '', code: '' });
                                },
                                this,
                              )
                            }
                            value={this.state.i18n.t(
                              'scenes.apps.account.account.email_add_modal.confirm',
                            )}
                            loading={this.state.loginService.loading}
                            loadingTimeout={1500}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <br />
                  <br />
                  <span className="smalltext">
                    {this.state.i18n.t('scenes.apps.account.account.description_main')}
                  </span>
                </div>
              </Attribute>

              <Attribute
                label={this.state.i18n.t('scenes.apps.account.account.password')}
                description={this.state.i18n.t('scenes.apps.account.account.password.description')}
              >
                <div className="parameters_form">
                  <Input
                    disabled={this.state.currentUserService.loading}
                    placeholder={this.state.i18n.t(
                      'scenes.apps.account.account.password_modal.old_password',
                    )}
                    className={this.state.currentUserService.badOldPassword ? 'error' : ''}
                    type="password"
                    value={this.state.oldPassword}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updatePassword(
                          this.state.oldPassword,
                          this.state.password,
                          this.state.password1,
                        );
                      }
                    }}
                    onChange={ev => this.setState({ oldPassword: ev.target.value })}
                  />
                  {this.state.currentUserService.badOldPassword && (
                    <span className="text error">
                      {this.state.i18n.t(
                        'scenes.apps.account.account.password_modal.bad_old_password',
                      )}
                    </span>
                  )}

                  <Input
                    disabled={this.state.currentUserService.loading}
                    placeholder={this.state.i18n.t(
                      'scenes.apps.account.account.password_modal.password',
                    )}
                    className={this.state.currentUserService.badNewPassword ? 'error' : ''}
                    type="password"
                    value={this.state.password}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updatePassword(
                          this.state.oldPassword,
                          this.state.password,
                          this.state.password1,
                        );
                      }
                    }}
                    onChange={ev => this.setState({ password: ev.target.value })}
                  />

                  <Input
                    disabled={this.state.currentUserService.loading}
                    placeholder={this.state.i18n.t(
                      'scenes.apps.account.account.password_modal.password',
                    )}
                    className={this.state.currentUserService.badNewPassword ? 'error' : ''}
                    type="password"
                    value={this.state.password1}
                    onKeyDown={e => {
                      if (e.keyCode === 13) {
                        currentUserService.updatePassword(
                          this.state.oldPassword,
                          this.state.password,
                          this.state.password1,
                        );
                      }
                    }}
                    onChange={ev => this.setState({ password1: ev.target.value })}
                  />
                  {this.state.currentUserService.badNewPassword && (
                    <span className="text error">
                      {this.state.i18n.t('scenes.apps.account.account.password_modal.bad_password')}
                    </span>
                  )}

                  <ButtonWithTimeout
                    href="#"
                    className="small buttonValidation"
                    disabled={this.state.currentUserService.loading}
                    onClick={() =>
                      currentUserService.updatePassword(
                        this.state.oldPassword,
                        this.state.password,
                        this.state.password1,
                      )
                    }
                    loading={this.state.currentUserService.loading}
                    value={this.state.i18n.t('general.update')}
                  />
                </div>
              </Attribute>
            </div>
          )}
        </form>
      );
    }
    if (this.state.page === 2) {
      return (
        <div className="">
          <div className="title">
            {Languages.t(
              'scenes.app.popup.userparameter.personnal_workspaces_title',
              [],
              'Vos espaces de travail',
            )}
          </div>

          <div className="group_section" />
        </div>
      );
    }
    if (this.state.page === 3) {
      return <Notifications />;
    }
  }

  setPage(page) {
    popupManager.popupStates['user_parameters'] = page;
    this.setState({ page: page });
  }
  render() {
    return (
      <div className="userParameter fade_in">
        <div className="main">
          <div className="sideBar">
            <MenuList
              menu={[
                {
                  type: 'menu',
                  text: this.state.i18n.t('scenes.apps.account.title'),
                  emoji: ':dark_sunglasses:',
                  selected: this.state.page === 1 ? 'selected' : '',
                  onClick: () => {
                    this.setPage(1);
                  },
                },
                {
                  type: 'menu',
                  text: this.state.i18n.t('scenes.apps.account.notifications.title'),
                  emoji: ':bell:',
                  selected: this.state.page === 3 ? 'selected' : '',
                  onClick: () => {
                    this.setPage(3);
                  },
                },
              ]}
            />
          </div>
          <div className="content">{this.displayScene()}</div>
        </div>
      </div>
    );
  }
}
