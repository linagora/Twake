import React, { useContext } from 'react';
import 'moment-timezone';
import { MoreHorizontal, Smile, ArrowUpRight, Trash2 } from 'react-feather';

import MessagesService from 'app/features/messages/services/messages-service';
import EmojiPicker from 'components/emoji-picker/emoji-picker.js';
import Menu from 'components/menus/menu.js';
import MenusManager from 'app/components/menus/menus-manager.js';
import Languages from 'services/languages/languages';
import AlertManager from 'services/AlertManager/AlertManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import User from 'app/features/users/services/current-user-service';
import DragIndicator from '@material-ui/icons/DragIndicator';
import MessageEditorsManager from 'app/features/messages/services/message-editor-service-factory';
import RouterServices from 'app/services/RouterService';
import { Application } from 'app/features/applications/types/application';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import Groups from 'services/workspaces/groups.js';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import useRouterWorkspace from 'app/state/recoil/hooks/router/useRouterWorkspace';
import useRouterChannel from 'app/state/recoil/hooks/router/useRouterChannel';
import _ from 'lodash';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import SideViewService from 'app/services/AppView/SideViewService';
import MainViewService from 'app/services/AppView/MainViewService';
import Emojione from 'app/components/emojione/emojione';

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

  const location = `message-${message.id}`;
  const subLocation = useContext(ViewContext).type;
  const { active: editorIsActive, set: setVisibleEditor } = useVisibleMessagesEditorLocation(
    location,
    subLocation,
  );

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
      icon: 'trash',
      text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
      className: 'error',
      onClick: () => {
        remove();
      },
    });
  } else {
    menu.push({
      type: 'menu',
      icon: 'arrow-up-right',
      text: Languages.t('scenes.apps.messages.message.show_button', [], 'Display'),
      onClick: () => {
        MessagesService.showMessage(message.thread_id);
      },
    });

    if (message.thread_id == message.id) {
      if (!message.context?.disable_pin) {
        menu.push({
          type: 'menu',
          icon: 'link',
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
          icon: 'map-pin',
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
          icon: 'edit-alt',
          text: Languages.t('scenes.apps.messages.message.modify_button', [], 'Edit'),
          onClick: () => {
            setVisibleEditor({ location, subLocation });
          },
        });
      }
      if (message?.stats?.replies <= 1) {
        menu.push({
          type: 'menu',
          icon: 'trash-alt',
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
      {/*!props.threadHeader && (
        <div className="message-options drag" key="drag">
          <div className="option js-drag-handler-message">
            <DragIndicator style={{ width: '18px' }} />
          </div>
        </div>
      )*/}
      <div className="message-options right" key="options">
        {[':heart:', ':+1:', ':eyes:', ':tada:'].map(emoji => (
          <>
            <div
              key={emoji}
              className={
                'option ' + (userReactions.map(m => m.name).includes(emoji) ? 'active' : '')
              }
              onClick={() => react([emoji], 'toggle')}
            >
              <Emojione type={emoji} />
            </div>
            <div className="separator"></div>
          </>
        ))}

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
                      react([emoji.colons], 'toggle');
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
        <div className="separator"></div>

        {!props.threadHeader && (
          <>
            <div
              className="option"
              onClick={() => {
                SideViewService.select(channelId, {
                  collection: MainViewService.getViewCollection(),
                  app: { identity: { code: 'messages' } } as Application,
                  context: {
                    viewType: 'channel_thread',
                    threadId: message.thread_id || message.id,
                  },
                });
              }}
            >
              <ArrowUpRight size={16} />
            </div>
            <div className="separator"></div>
          </>
        )}

        <Menu
          className="option"
          onOpen={(evt: any) => onOpen(evt)}
          onClose={() => props.onClose && props.onClose()}
          menu={menu}
          position={'left'}
        >
          <MoreHorizontal size={16} />
        </Menu>
      </div>
    </div>
  );
};
