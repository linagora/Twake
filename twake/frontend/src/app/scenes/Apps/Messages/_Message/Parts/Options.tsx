import React from 'react';
import 'moment-timezone';
import { MoreHorizontal, Smile, ArrowUpRight, Trash2 } from 'react-feather';

import MessagesService from 'services/Apps/Messages/Messages';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import Languages from 'services/languages/languages';
import Workspaces from 'services/workspaces/workspaces.js';
import AlertManager from 'services/AlertManager/AlertManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import User from 'services/user/UserService';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import DragIndicator from '@material-ui/icons/DragIndicator';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import RouterServices from 'app/services/RouterService';
import { Message } from 'app/models/Message';
import MessageReactionService from 'app/services/Apps/Messages/MessageReactionService';
import { Application } from 'app/models/App';
import { getCompanyApplications } from 'app/state/recoil/atoms/CompanyApplications';
import Groups from 'services/workspaces/groups.js';

type Props = {
  message: Message;
  collectionKey: string;
  onOpen?: () => void;
  onClose?: () => void;
  threadHeader?: string;
};

export default (props: Props) => {
  const menu: any[] = [];

  const triggerApp = (app: any) => {
    var data = {
      channel: Collections.get('channels').find(props.message.channel_id),
      parent_message: Collections.get('messages').find(props.message.parent_message_id) || null,
      message: props.message,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'action', data);
  };

  const onOpen = (evt: any) => {
    props.onOpen && props.onOpen();
    evt && evt.preventDefault() && evt.stopPropagation();
  };

  if (props.message._user_ephemeral) {
    menu.push({
      type: 'menu',
      text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
      className: 'error',
      onClick: () => {
        MessagesService.deleteMessage(props.message, props.collectionKey);
      },
    });
  } else {
    if (!props.message.parent_message_id) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.apps.messages.message.show_button', [], 'Display'),
        onClick: () => {
          MessagesService.showMessage(props.message.id);
        },
      });
    }

    if (!props.message.parent_message_id) {
      if (!(props.message.hidden_data || {}).disable_pin) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.copy_link', [], 'Copy link to message'),
          onClick: () => {
            const workspace = Collections.get('workspaces').find(Workspaces.currentWorkspaceId);
            const url = `${document.location.origin}${RouterServices.generateRouteFromState({
              workspaceId: workspace.id,
              channelId: props.message.channel_id,
              messageId: props.message.parent_message_id || props.message.id,
            })}`;
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
          },
        });

        menu.push({
          type: 'menu',
          text: Languages.t(
            !props.message.pinned
              ? 'scenes.apps.messages.message.pin_button'
              : 'scenes.apps.messages.message.unpin_button',
            [],
            'Pin message',
          ),
          className: 'option_button',
          onClick: () => {
            MessagesService.pinMessage(props.message, !props.message.pinned, props.collectionKey);
          },
        });
      }
    }

    const apps =
      getCompanyApplications(Groups.currentGroupId).filter(
        (app: Application) => app.display?.twake?.chat?.actions?.length,
      ) || [];

    if (apps.length > 0) {
      menu.push({ type: 'separator' });
      menu.push({
        type: 'react-element',
        reactElement: (level: any) => {
          return apps.map((app: any) => {
            return (
              <div
                className="menu"
                onClick={() => {
                  triggerApp(app);
                }}
              >
                <div className="text">
                  <div
                    className="menu-app-icon"
                    style={{ backgroundImage: 'url(' + app.identity?.icon + ')' }}
                  />
                  {app.display.twake.chat.actions[0].description || app.identity?.name}
                </div>
              </div>
            );
          });
        },
      });
    }

    if (
      props.message.sender === User.getCurrentUserId() ||
      (props.message.application_id &&
        (props.message.hidden_data || {}).allow_delete === 'everyone') ||
      (props.message.application_id &&
        WorkspaceUserRights.hasWorkspacePrivilege() &&
        (props.message.hidden_data || {}).allow_delete === 'administrators')
    ) {
      if (menu.length > 0 && (!props.message.application_id || !props.message.responses_count)) {
        menu.push({ type: 'separator' });
      }
      if (!props.message.application_id) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.modify_button', [], 'Edit'),
          onClick: () => {
            MessageEditorsManager.get(props.message?.channel_id || '').openEditor(
              props.message?.parent_message_id || '',
              props.message?.id || '',
              'edition',
            );
          },
        });
      }
      if (!props.message.responses_count) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
          className: 'error',
          onClick: () => {
            AlertManager.confirm(() =>
              MessagesService.deleteMessage(props.message, props.collectionKey),
            );
          },
        });
      }
    }
  }

  if (props.message._user_ephemeral) {
    return (
      <div className="message-options right">
        <div
          className="option"
          onClick={() => {
            MessagesService.deleteMessage(props.message, props.collectionKey);
          }}
        >
          <Trash2 size={16} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {!props.threadHeader && (
        <div className="message-options drag" key="drag">
          <div className="option js-drag-handler-message">
            <DragIndicator style={{ width: '18px' }} />
          </div>
        </div>
      )}
      <div className="message-options right" key="options">
        <Menu
          className="option"
          onOpen={(evt: any) => onOpen(evt)}
          menu={[
            {
              type: 'react-element',
              className: 'menu-cancel-margin',
              reactElement: () => {
                return (
                  <EmojiPicker
                    selected={props.message._user_reaction || ''}
                    onChange={(emoji: any) => {
                      MenusManager.closeMenu();
                      props.onClose && props.onClose();
                      MessageReactionService.react(
                        props.message,
                        emoji.colons,
                        props.collectionKey,
                      );
                    }}
                  />
                );
              },
            },
          ]}
          position="top"
        >
          <Smile size={16} />
        </Menu>
        {!props.threadHeader && (
          <div
            className="option"
            onClick={() => {
              MessagesService.showMessage(props.message.parent_message_id || props.message.id);
            }}
          >
            <ArrowUpRight size={16} />
          </div>
        )}
        {menu.length > 0 && (
          <Menu
            className="option"
            onOpen={(evt: any) => onOpen(evt)}
            onClose={() => props.onClose && props.onClose()}
            menu={menu}
            position={'left'}
          >
            <MoreHorizontal size={16} />
          </Menu>
        )}
      </div>
    </div>
  );
};
