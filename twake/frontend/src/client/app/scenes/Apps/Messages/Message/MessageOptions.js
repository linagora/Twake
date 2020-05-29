import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import User from 'services/user/user.js';
import Emojione from 'components/Emojione/Emojione.js';
import Moment from 'react-moment';
import moment from 'moment';
import 'moment-timezone';
import Loader from 'components/Loader/Loader.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import Draggable from 'components/Draggable/Draggable.js';
import Responses from './Responses.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'services/Menus/MenusManager.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import ReactionIcon from '@material-ui/icons/SentimentSatisfiedAltOutlined';
import CommentIcon from '@material-ui/icons/ReplyOutlined';
import StarIcon from '@material-ui/icons/StarBorderOutlined';
import StarCompleteIcon from '@material-ui/icons/StarOutlined';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import './Message.scss';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import Icon from 'components/Icon/Icon.js';

export default class MessageOptions extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }

  triggerApp(app) {
    var data = {
      channel: Collections.get('channels').find(this.props.channelId),
      parent_message:
        Collections.get('messages').find(this.props.message.parent_message_id) || null,
      message: this.props.message,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'action', data);
  }

  render() {
    var list = [];

    if (!this.props.message._user_ephemeral) {
      if (!(this.props.message.hidden_data || {}).disable_reactions) {
        list.push(
          <Menu
            className="option_button"
            ref={node => (this.emoji_dom_button = node)}
            menu={[
              {
                type: 'react-element',
                reactElement: () => {
                  return (
                    <EmojiPicker
                      noPicker={false}
                      selected={this.props.message._user_reaction || ''}
                      onChange={emoji => {
                        MenusManager.closeMenu();
                        this.setState({ my_reaction: emoji.shortname });
                        MessagesService.react(
                          this.props.message,
                          emoji.shortname,
                          this.props.messagesCollectionKey,
                        );
                      }}
                    />
                  );
                },
              },
            ]}
            onClose={() => {
              this.props.parent.setState({ is_selected: false });
            }}
            onOpen={() => {
              this.props.parent.setState({ is_selected: true });
            }}
            position="top"
          >
            <ReactionIcon className="m-icon-small" />
          </Menu>,
        );
      }

      if (!this.props.message.parent_message_id) {
        if (
          !(this.props.message.hidden_data || {}).disable_responses &&
          !this.props.disableResponses
        ) {
          list.push(
            <div
              className="option_button"
              onClick={() => MessagesService.startRespond(this.props.message)}
            >
              <Icon type="enter" className="m-icon-small" />
            </div>,
          );
        }
        if (!(this.props.message.hidden_data || {}).disable_pin) {
          list.push(
            <div
              className={'option_button ' + (this.props.message.pinned && 'selected')}
              onClick={() =>
                MessagesService.pinMessage(
                  this.props.message,
                  !this.props.message.pinned,
                  this.props.messagesCollectionKey,
                )
              }
            >
              <Icon type="map-pin-alt" className="m-icon-small" />
            </div>,
          );
        }
      }
    }

    var menu = [];

    if (this.props.message._user_ephemeral) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Supprimer'),
        className: 'error',
        onClick: () => {
          MessagesService.deleteMessage(this.props.message, this.props.messagesCollectionKey);
        },
      });
    } else {
      if (!this.props.message.parent_message_id) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.show_button', [], 'Afficher'),
          onClick: () => {
            MessagesService.showMessage(this.props.message.id);
          },
        });
      }

      var apps =
        WorkspacesApps.getApps().filter(
          app => ((app.display || {}).messages_module || {}).action,
        ) || [];
      if (apps.length > 0) {
        menu.push({ type: 'separator' });
        menu.push({
          type: 'react-element',
          reactElement: level => {
            return apps.map(app => {
              return (
                <div
                  className="menu"
                  onClick={() => {
                    this.triggerApp(app);
                  }}
                >
                  <div className="text">
                    <div
                      className="menu-app-icon"
                      style={{ backgroundImage: 'url(' + app.icon_url + ')' }}
                    />
                    {app.display.messages_module.action.description || app.name}
                  </div>
                </div>
              );
            });
          },
        });
      }

      if (
        this.props.message.sender == User.getCurrentUserId() ||
        (this.props.message.application_id &&
          (this.props.message.hidden_data || {}).allow_delete == 'everyone') ||
        (this.props.message.application_id &&
          WorkspaceUserRights.hasWorkspacePrivilege() &&
          (this.props.message.hidden_data || {}).allow_delete == 'administrators')
      ) {
        if (
          menu.length > 0 &&
          (!this.props.message.application_id || !this.props.message.responses_count)
        ) {
          menu.push({ type: 'separator' });
        }
        if (!this.props.message.application_id) {
          menu.push({
            type: 'menu',
            text: Languages.t('scenes.apps.messages.message.modify_button', [], 'Modifier'),
            onClick: () => {
              MessagesService.startEditing(this.props.message);
            },
          });
        }
        if (!this.props.message.responses_count) {
          menu.push({
            type: 'menu',
            text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Supprimer'),
            className: 'error',
            onClick: () => {
              AlertManager.confirm(() =>
                MessagesService.deleteMessage(this.props.message, this.props.messagesCollectionKey),
              );
            },
          });
        }
      }
    }

    if (menu.length > 0) {
      list.push(
        <Menu
          className="hidden_no_hover option_button"
          onOpen={() => this.props.parent.setState({ is_selected: true })}
          onClose={() => this.props.parent.setState({ is_selected: false })}
          menu={menu}
          position={'left'}
        >
          <EditIcon className="m-icon-small" />
        </Menu>,
      );
    }

    return list;
  }
}
