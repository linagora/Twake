import React, { useContext } from 'react';
import 'moment-timezone';
import { MoreHorizontal, Smile, ArrowUpRight, Trash2, CornerDownLeft } from 'react-feather';

import EmojiPicker from 'components/emoji-picker/emoji-picker.js';
import Menu from 'components/menus/menu.js';
import MenusManager from 'app/components/menus/menus-manager.js';
import Languages from 'app/features/global/services/languages-service';
import AlertManager from 'app/features/global/services/alert-manager-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import User from 'app/features/users/services/current-user-service';
import RouterServices from 'app/features/router/services/router-service';
import { Application } from 'app/features/applications/types/application';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import Groups from 'app/deprecated/workspaces/groups.js';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import SideViewService from 'app/features/router/services/side-view-service';
import Emojione from 'app/components/emojione/emojione';
import { useChannel } from 'app/features/channels/hooks/use-channel';
import { useEphemeralMessages } from 'app/features/messages/hooks/use-ephemeral-messages';
import { copyToClipboard } from 'app/features/global/utils/CopyClipboard';
import { addUrlTryDesktop } from 'app/views/desktop-redirect';
import { useMessageQuoteReply } from 'app/features/messages/hooks/use-message-quote-reply';
import { useMessageSeenBy } from 'app/features/messages/hooks/use-message-seen-by';
import { EmojiSuggestionType } from 'app/components/rich-text-editor/plugins/emoji';
import { MessagesListContext } from '../../messages-list';

type Props = {
  onOpen?: () => void;
  onClose?: () => void;
  threadHeader?: string;
};

export default (props: Props) => {
  const channelId = useRouterChannel();
  const workspaceId = useRouterWorkspace();
  const context = useContext(MessageContext);
  const listContext = useContext(MessagesListContext);
  const { message, react, remove, pin } = useMessage(context);
  const { channel } = useChannel(channelId);
  const { message: thread } = useMessage({
    companyId: channel.company_id || '',
    threadId: message.thread_id,
    id: message.thread_id,
  });
  const { remove: removeLastEphemeral } = useEphemeralMessages({
    companyId: context.companyId,
    channelId: channelId,
  });
  const location = `message-${message.id}`;
  const subLocation = useContext(ViewContext).type;
  const { set: setVisibleEditor } = useVisibleMessagesEditorLocation(location, subLocation);

  const { set: setQuoteReply } = useMessageQuoteReply(channelId);

  const { openSeenBy } = useMessageSeenBy();

  const menu: Record<string, string | (() => void)>[] = [];

  const triggerApp = (app: Application) => {
    const data = {
      channel: channel,
      thread: thread.id && thread.id !== message.id ? thread : null,
      message: message,
    };
    WorkspacesApps.notifyApp(app.id, 'action', 'action', data);
  };

  const onOpen = (evt: Event) => {
    props.onOpen && props.onOpen();
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  };

  if (message.ephemeral) {
    menu.push({
      type: 'menu',
      icon: 'trash',
      text: Languages.t('scenes.apps.messages.message.remove_button', [], 'Delete'),
      className: 'error',
      onClick: () => {
        removeLastEphemeral();
      },
    });
  } else {
    if (channel && channel.visibility !== 'direct') {
      menu.push({
        type: 'menu',
        icon: 'arrow-up-right',
        text: Languages.t('scenes.apps.messages.message.show_button', [], 'Display'),
        onClick: () => {
          SideViewService.select(channel?.id || '', {
            app: { identity: { code: 'messages' } } as Application,
            context: {
              viewType: 'channel_thread',
              threadId: message.thread_id,
            },
          });
        },
      });
    }

    menu.push({
      type: 'menu',
      icon: 'link',
      text: Languages.t('scenes.apps.messages.message.copy_link', [], 'Copy link to message'),
      onClick: () => {
        const url = addUrlTryDesktop(
          `${document.location.origin}${RouterServices.generateRouteFromState({
            workspaceId: workspaceId,
            channelId: channelId,
            threadId: message.thread_id,
            messageId: message.id,
          })}`,
        );

        copyToClipboard(url);
      },
    });

    if (channel && channel.visibility === 'direct' && !listContext.readonly) {
      menu.push({
        type: 'menu',
        icon: 'corner-down-left',
        text: Languages.t('scenes.apps.messages.message.reply_button', [], 'Reply'),
        onClick: () => {
          setQuoteReply({ message: message.thread_id, channel: channelId });
        },
      });
    }

    menu.push({
      type: 'menu',
      icon: 'comment-info',
      text: Languages.t('components.message_seen_by.btn', [], 'Information'),
      onClick: () => {
        openSeenBy({
          message_id: message.id,
          company_id: context.companyId,
          thread_id: message.thread_id,
          workspace_id: context.workspaceId,
        });
      },
    });

    if (!message.context?.disable_pin && !listContext.readonly)
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

    const apps =
      getCompanyApplications(Groups.currentGroupId).filter(
        (app: Application) => app.display?.twake?.chat?.actions?.length,
      ) || [];

    if (apps.length > 0 && !listContext.readonly) {
      menu.push({ type: 'separator' });
      menu.push({
        type: 'react-element',
        reactElement: () => {
          return apps.map((app: Application) => {
            return (
              <div
                key={app.id}
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
                  {app?.display?.twake?.chat?.actions?.[0].description || app.identity?.name}
                </div>
              </div>
            );
          });
        },
      });
    }

    if (
      (message.user_id === User.getCurrentUserId() ||
        (message.application_id && message.context?.allow_delete === 'everyone') ||
        (message.application_id &&
          WorkspaceUserRights.hasWorkspacePrivilege() &&
          message.context?.allow_delete === 'administrators')) &&
      !listContext.readonly
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
            removeLastEphemeral();
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
        {!listContext.readonly && (
          <>
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
              onOpen={(evt: Event) => onOpen(evt)}
              menu={[
                {
                  type: 'react-element',
                  className: 'menu-cancel-margin',
                  reactElement: () => {
                    return (
                      <EmojiPicker
                        selected={userReactions.map(e => e.name) || []}
                        onChange={(emoji: EmojiSuggestionType) => {
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
          </>
        )}

        {!props.threadHeader && channel && channel.visibility !== 'direct' && (
          <>
            <div
              className="option"
              onClick={() => {
                SideViewService.select(channelId, {
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

        {channel && channel.visibility === 'direct' && !listContext.readonly && (
          <>
            <div
              className="option"
              onClick={() => {
                setQuoteReply({ message: message.thread_id, channel: channelId });
              }}
            >
              <CornerDownLeft size={16} />
            </div>
            <div className="separator"></div>
          </>
        )}

        <Menu
          className="option"
          onOpen={(evt: Event) => onOpen(evt)}
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
