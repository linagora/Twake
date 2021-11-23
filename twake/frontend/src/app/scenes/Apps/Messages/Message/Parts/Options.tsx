import React, { useContext } from 'react';
import 'moment-timezone';
import { MoreHorizontal, Smile, ArrowUpRight, Trash2 } from 'react-feather';

import MessagesService from 'services/Apps/Messages/Messages';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import Languages from 'services/languages/languages';
import AlertManager from 'services/AlertManager/AlertManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import User from 'services/user/UserService';
import DragIndicator from '@material-ui/icons/DragIndicator';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import RouterServices from 'app/services/RouterService';
import { Application } from 'app/models/App';
import { getCompanyApplications } from 'app/state/recoil/hooks/useCompanyApplications';
import Groups from 'services/workspaces/groups.js';
import { MessageContext } from '../MessageWithReplies';
import { useMessage } from 'app/state/recoil/hooks/useMessage';
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';
import useRouterChannel from 'app/state/recoil/hooks/useRouterChannel';
import _ from 'lodash';

type Props = {
  onOpen?: () => void;
  onClose?: () => void;
  threadHeader?: string;
};

export default (props: Props) => {
  const channelId = useRouterChannel();
  const workspaceId = useRouterWorkspace();
  const context = useContext(MessageContext);
  let { message, react, remove, pin } = useMessage(context);

  const menu: any[] = [];

  const triggerApp = (app: any) => {
    var data = {
      channel: {}, //TODO Collections.get('channels').find(message.channel_id),
      parent_message: {}, //TODO Collections.get('messages').find(message.parent_message_id) || null,
      message: message,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'action', data);
  };

  const onOpen = (evt: any) => {
    props.onOpen && props.onOpen();
    evt && evt.preventDefault() && evt.stopPropagation();
  };

  if (message.ephemeral) {
    menu.push({
      type: 'menu',
      text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
      className: 'error',
      onClick: () => {
        remove();
      },
    });
  } else {
    if (message.thread_id == message.id) {
      menu.push({
        type: 'menu',
        text: Languages.t('scenes.apps.messages.message.show_button', [], 'Display'),
        onClick: () => {
          MessagesService.showMessage(message.id);
        },
      });
    }

    if (message.thread_id == message.id) {
      if (!message.context?.disable_pin) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.copy_link', [], 'Copy link to message'),
          onClick: () => {
            const url = `${document.location.origin}${RouterServices.generateRouteFromState({
              workspaceId: workspaceId,
              channelId: channelId,
              messageId: message.thread_id || message.id,
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
            !message.pinned_info?.pinned_at
              ? 'scenes.apps.messages.message.pin_button'
              : 'scenes.apps.messages.message.unpin_button',
            [],
            'Pin message',
          ),
          className: 'option_button',
          onClick: () => {
            pin(!message.pinned_info?.pinned_at);
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
      message.user_id === User.getCurrentUserId() ||
      (message.application_id && message.context?.allow_delete === 'everyone') ||
      (message.application_id &&
        WorkspaceUserRights.hasWorkspacePrivilege() &&
        message.context?.allow_delete === 'administrators')
    ) {
      if (menu.length > 0 && (!message.application_id || !message?.stats?.replies)) {
        menu.push({ type: 'separator' });
      }
      if (!message.application_id) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.modify_button', [], 'Edit'),
          onClick: () => {
            //TODO
            MessageEditorsManager.get(channelId || '').openEditor(
              message?.thread_id || '',
              message?.id || '',
              'edition',
            );
          },
        });
      }
      if (!message?.stats?.replies) {
        menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
          className: 'error',
          onClick: () => {
            AlertManager.confirm(() => remove());
          },
        });
      }
    }
  }

  if (message.ephemeral) {
    return (
      <div className="message-options right">
        <div
          className="option"
          onClick={() => {
            remove();
          }}
        >
          <Trash2 size={16} />
        </div>
      </div>
    );
  }

  const userReactions = (message.reactions || [])?.filter(r =>
    r.users.includes(User.getCurrentUserId()),
  );

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
                    selected={userReactions.map(e => e.name) || []}
                    onChange={(emoji: any) => {
                      MenusManager.closeMenu();
                      props.onClose && props.onClose();
                      react([emoji], 'toggle');
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
              //TODO
              //MessagesService.showMessage(message.parent_message_id || message.id);
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
