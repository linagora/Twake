import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione.js';
import User from 'components/User/User.js';
import AutoComplete from 'components/AutoComplete/AutoComplete.js';
import EmojiService from 'services/emojis/emojis.js';
import UsersService from 'services/user/user.js';
import MenusManager from 'services/Menus/MenusManager.js';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import './Input.scss';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import Menu from 'components/Menus/Menu.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspacesUser from 'services/workspaces/workspaces_users.js';
import ChannelsService from 'services/channels/channels.js';
import LocalStorage from 'services/localStorage.js';
import Button from 'components/Buttons/Button.js';

export default class Input extends Component {
  constructor(props) {
    super(props);

    this.state = {
      i18n: Languages,
      content: props.value || '',
    };

    Languages.addListener(this);
    this.keyEventOnPage = this.keyEventOnPage.bind(this);
    this.disable_app = {};
  }
  componentDidMount() {
    this.focus();

    !this.props.disableLocalStorage &&
      LocalStorage.getItem('m_input_' + this.props.localStorageIdentifier, res => {
        if (!this.state.content && res) {
          this.setState({ content: res });
        }
      });

    if (this.props.enableAutoFocus) {
      document.addEventListener('keydown', this.keyEventOnPage);
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);

    if (this.props.enableAutoFocus && !this.disabled) {
      document.removeEventListener('keydown', this.keyEventOnPage);
    }
  }
  componentDidUpdate() {
    if (this.props.disabled != this.disabled) {
      this.disabled = this.props.disabled;
      if (this.props.enableAutoFocus) {
        if (this.disabled) {
          document.removeEventListener('keydown', this.keyEventOnPage);
        } else {
          document.addEventListener('keydown', this.keyEventOnPage);
        }
      }
    }
  }
  keyEventOnPage(evt) {
    if (document.activeElement == document.body) {
      var inp = String.fromCharCode(evt.keyCode);
      if (
        /[a-zA-Z0-9-_ ]/.test(inp) &&
        ((!evt.altKey && !evt.ctrlKey && !evt.metaKey) || /[Vv]/.test(inp))
      ) {
        this.focus();
      }
    }
  }
  send() {
    if (this.state.content.trim()) {
      this.setState({ sent: true });
      if (this.sent_timeout) {
        clearTimeout(this.sent_timeout);
      }
      this.sent_timeout = setTimeout(() => {
        this.setState({ sent: false });
      }, 600);
      if (this.props.onSend) this.props.onSend(this.state.content);
    }
  }
  onKeyUp(evt) {
    if (evt.key == 'ArrowUp' && !this.state.content) {
      //Edit last message from ourselve
      this.props.onEditLastMessage && this.props.onEditLastMessage();
    }
    this.disable_enter = false;
  }
  onKeyPress(evt) {
    if (evt.key === 'Enter') {
      if (this.disable_enter) {
        evt.stopPropagation();
        evt.preventDefault();
        return;
      }
      this.disable_enter = true;
      if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();
        LocalStorage.setItem('m_input_' + this.props.localStorageIdentifier, '');
        this.send();
      } else {
        var target = evt.target;
        var result = PseudoMarkdownCompiler.autoCompleteBulletList(target, true);
        if (result) {
          this.change(result);
        }
        evt.stopPropagation();
        evt.preventDefault();
      }
    }
  }
  change(text) {
    !this.props.disableLocalStorage &&
      LocalStorage.setItem('m_input_' + this.props.localStorageIdentifier, text);
    this.setState({ content: text });
    if (this.props.onChange) this.props.onChange(text);
  }
  focus() {
    if (this.autocomplete) {
      this.autocomplete.focus();
      this.props.onFocus && this.props.onFocus();
    }
  }
  triggerApp(app, from_icon, evt) {
    if (this.disable_app[app.id] && new Date().getTime() - this.disable_app[app.id] < 1000) {
      return;
    }
    this.disable_app[app.id] = new Date().getTime();
    if (this.props.triggerApp) {
      this.props.triggerApp(app, from_icon, evt);
    }
  }
  searchCommand(text, cb) {
    var commands = [];
    var apps = WorkspacesApps.getApps().map(app => {
      var _commands = ((app.display || {}).messages_module || {}).commands || [];
      _commands = _commands.map(co => {
        return { command: '/' + app.simple_name + ' ' + co.command, description: co.description };
      });
      commands = commands.concat(_commands);
    });
    var res = commands.filter(co => co.command.startsWith('/' + text));
    cb(res);
  }
  setValue(val) {
    !this.props.disableLocalStorage &&
      LocalStorage.setItem('m_input_' + this.props.localStorageIdentifier, val);
    this.setState({ content: val });
  }
  render() {
    var autocompletes = [/\B@([\-+\w]+)$/, /\B#([a-zA-Z\u00C0-\u017F]+)$/, /\B:([\-+\w]+)$/];

    if (!this.props.disableApps) {
      autocompletes.push(/^\/([a-z0-9]*)$/);
    }

    var addon_menu = [];
    var apps = WorkspacesApps.getApps().filter(
      app => ((app.display || {}).messages_module || {}).in_plus,
    );
    if (apps.length > 0) {
      apps.map(app => {
        var icon = WorkspacesApps.getAppIcon(app);
        var emoji = '';
        if ((icon || '').indexOf('http') === 0) {
          emoji = icon;
          icon = '';
        }
        addon_menu.push({
          type: 'menu',
          emoji: emoji,
          icon: icon,
          text: app.name,
          onClick: evt => {
            this.triggerApp(app, undefined, evt);
          },
        });
      });
    } else {
      addon_menu.push({
        type: 'react-element',
        reactElement: level => {
          return [
            <div className="menu-text">
              {Languages.t(
                'scenes.apps.messages.input.no_email_module_menu_text',
                [],
                "Vous n'avez aucun module de messagerie.",
              )}
            </div>,
            <div className="menu-separator" />,
            <div
              className="menu "
              onClick={() =>
                popupManager.open(
                  <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
                  true,
                  'workspace_parameters',
                )
              }
            >
              <div className="text">
                {Languages.t(
                  'scenes.apps.messages.input.search_module_text',
                  [],
                  'Chercher des modules...',
                )}
              </div>
            </div>,
          ];
        },
      });
    }

    return (
      <div className={'write_message ' + this.props.className}>
        {!this.props.disableApps && (
          <Menu className="addons button" position="top" menu={addon_menu}>
            <Icon type="plus" />
          </Menu>
        )}
        <div className="input">
          <AutoComplete
            ref={node => {
              this.autocomplete = node;
            }}
            onResize={this.props.onResize}
            search={[
              (text, cb) => {
                WorkspacesUser.searchUserInWorkspace(text, cb);
              },
              (text, cb) => {
                ChannelsService.search(text, cb);
              },
              (text, cb) => {
                EmojiService.search(text, cb, true);
              },
              (text, cb) => {
                this.searchCommand(text, cb);
              },
            ]}
            max={[5, 5, 5, 20]}
            renderItemChoosen={[
              item => {
                return '@' + item.username + ' ';
              },
              item => {
                return (
                  '#' +
                  item.name.toLocaleLowerCase().replace(/[^a-z0-9_\-.\u00C0-\u017F]/g, '') +
                  ' '
                );
              },
              item => {
                return item.shortname + ' ';
              },
              item => {
                return item.command.split('[')[0].split('"')[0];
              },
            ]}
            renderItem={[
              item => {
                return [
                  <div className="icon">
                    <User user={item} small />
                  </div>,
                  <div className="text">
                    {UsersService.getFullName(item)}{' '}
                    <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>
                      @{item.username}
                    </span>
                  </div>,
                ];
              },
              item => {
                return [
                  <div className="icon">
                    <Emojione type={item.icon} />
                  </div>,
                  <div className="text">{item.name}</div>,
                ];
              },
              item => {
                return [
                  <div className="icon">
                    <Emojione type={item.shortname} />
                  </div>,
                  <div className="text">
                    {item.shortname}{' '}
                    <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>{item.name}</span>
                  </div>,
                ];
              },
              item => {
                return (
                  <div>
                    <b>{item.command.split(' ')[0]}</b>{' '}
                    {item.command
                      .split(' ')
                      .slice(1)
                      .join(' ')}
                    <span style={{ marginLeft: 5, opacity: 0.5 }}>{item.description}</span>
                  </div>
                );
              },
            ]}
            regexHooked={autocompletes}
            placeholder={Languages.t(
              'scenes.apps.messages.input.autocompletes_placeholder',
              [],
              'Écrivez un message, utilisez @ pour citer un utilisateur.',
            )}
            autoHeight
            value={this.state.content}
            onChange={evt => {
              this.change(evt.target.value);
            }}
            onKeyPress={evt => this.onKeyPress(evt)}
            onKeyUp={evt => this.onKeyUp(evt)}
            position={'top'}
            onEscape={this.props.onEscape}
            onFocusChange={status => {
              if (status) {
                this.props.onFocus && this.props.onFocus();
              }
            }}
          />

          <div className="input_addons">
            <span
              ref={node => (this.emoji_dom = node)}
              onClick={() => {
                if (this.emojiPickerIsOpen) {
                  return;
                }
                var menu = [
                  {
                    type: 'react-element',
                    reactElement: () => {
                      return (
                        <EmojiPicker
                          onChange={emoji => {
                            MenusManager.closeMenu();
                            this.autocomplete.putTextAtCursor(' ' + emoji.shortname + ' ');
                            this.emojiPickerIsOpen = false;
                            setTimeout(() => {
                              this.autocomplete.focus();
                            }, 200);
                          }}
                        />
                      );
                    },
                  },
                ];
                var elementRect = window.getBoundingClientRect(this.emoji_dom);
                elementRect.x = elementRect.x || elementRect.left;
                elementRect.y = elementRect.y || elementRect.top;
                MenusManager.openMenu(menu, elementRect, 'top');
                setTimeout(() => {
                  this.emojiPickerIsOpen = false;
                }, 200);
              }}
            >
              <Icon type="smile" />
            </span>
            {!this.props.disableApps &&
              (
                WorkspacesApps.getApps().filter(
                  app => ((app.display || {}).messages_module || {}).right_icon,
                ) || []
              ).map(app => {
                return (
                  <span
                    key={app.id}
                    className="messages-input"
                    onClick={evt => {
                      this.triggerApp(app, true, evt);
                    }}
                  >
                    <div
                      className="messages-input-app-icon"
                      style={{
                        backgroundImage:
                          'url(' +
                          (app.display.messages_module.right_icon.icon_url || app.icon_url) +
                          ')',
                      }}
                    />
                  </span>
                );
              })}
          </div>
        </div>
        {!this.props.disableSend && (
          <div className={'send'}>
            <Button
              className="medium primary"
              onClick={() => {
                this.state.content.trim() && this.send();
              }}
            >
              {Languages.t('scenes.apps.messages.input.send_button', [], 'Envoyer')}
            </Button>
            {/*<SendIcon className="send_main m-icon-medium" />
            <SendIcon className="send_hidden m-icon-medium" />*/}
          </div>
        )}

        {!this.props.disableSend && (
          <div className={'input_info ' + (this.state.content.trim() ? 'visible ' : '')}>
            <b>*bold*</b> <span style={{ textDecoration: 'underline' }}>_underline_</span>{' '}
            <span style={{ textDecoration: 'line-through' }}>~strikethrough~</span> <i>°italic°</i>{' '}
            <span style={{ fontFamily: 'monospace' }}>`code`</span>
          </div>
        )}
      </div>
    );
  }
}
