import React, { useState } from 'react';
import { Send, Smile, AlignLeft, Video, MoreHorizontal, Paperclip } from 'react-feather';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'services/Menus/MenusManager.js';
import Languages from 'services/languages/languages.js';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';

type Props = {
  inputValue: string;
  channelId: string;
  threadId: string;
  onAddEmoji?: (emoji: any) => void;
  onSend?: () => void;
  triggerApp?: (app: any, fromIcon: any, evt: any) => void;
  isEmpty: boolean;
};

export default (props: Props) => {
  var addon_menu: any[] = [];
  var addon_right_icon: any[] = [];
  var addon_files: any[] = [];
  var addon_calls: any[] = [];
  var apps = WorkspacesApps.getApps().filter(
    app => app.display?.messages_module?.in_plus || app.display?.messages_module?.right_icon,
  );

  if (props.triggerApp) {
    if (apps.length > 0) {
      apps.map(app => {
        var icon = WorkspacesApps.getAppIcon(app);
        var emoji = '';
        if ((icon || '').indexOf('http') === 0) {
          emoji = icon;
          icon = '';
        }
        const menu_item = {
          type: 'menu',
          emoji: emoji,
          icon: icon,
          text: app.name,
          onClick: (evt: any) => {
            props.triggerApp && props.triggerApp(app, undefined, evt);
          },
        };

        if (
          app.simple_name === 'twake_drive' ||
          app.display?.messages_module?.right_icon?.type === 'file'
        ) {
          addon_files.push(menu_item);
        } else if (
          app.simple_name === 'jitsi' ||
          app.display?.messages_module?.right_icon?.type === 'call'
        ) {
          addon_calls.push(menu_item);
        } else if (app.display?.messages_module?.right_icon) {
          addon_right_icon.push(app);
        } else {
          addon_menu.push(menu_item);
        }
      });
    }

    if (addon_menu.length === 0) {
      addon_menu = addon_menu.concat([
        {
          type: 'text',
          text: Languages.t('scenes.apps.messages.input.no_email_module_menu_text'),
        },
        {
          type: 'separator',
        },
        {
          type: 'menu',
          text: Languages.t('scenes.apps.messages.input.search_module_text'),
          onClick: () =>
            popupManager.open(
              <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
              true,
              'workspace_parameters',
            ),
        },
      ]);
    }
  }

  return (
    <div className="input-options">
      <Menu
        className="option"
        position="top"
        menu={[
          {
            type: 'menu',
            icon: 'desktop',
            text: 'From computer',
            onClick: (evt: any) => {
              MessageEditorsManager.get(props.channelId).openFileSelector(props.threadId);
            },
          },
          ...addon_files,
        ]}
      >
        <Paperclip size={16} />
      </Menu>

      {props.onAddEmoji && (
        <Menu
          className="option"
          menu={[
            {
              type: 'react-element',
              className: 'menu-cancel-margin',
              reactElement: () => {
                return (
                  <EmojiPicker
                    onChange={(emoji: any) => {
                      MenusManager.closeMenu();
                      props.onAddEmoji && props.onAddEmoji(emoji);
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
      )}
      {addon_calls.length > 1 && (
        <Menu className="option" position="top" menu={addon_calls}>
          <Video size={16} />
        </Menu>
      )}
      {addon_calls.length === 1 && (
        <div className="option" onClick={evt => addon_calls[0].onClick(evt)}>
          <Video size={16} />
        </div>
      )}

      {addon_right_icon.map((app: any) => {
        return (
          <div
            className="option"
            onClick={(evt: any) => {
              props.triggerApp && props.triggerApp(app, true, evt);
            }}
          >
            <div
              className="messages-input-app-icon"
              style={{
                backgroundImage:
                  'url(' + (app.display.messages_module.right_icon.icon_url || app.icon_url) + ')',
              }}
            />
          </div>
        );
      })}

      {addon_menu.length > 0 && (
        <Menu className="option" position="top" menu={addon_menu}>
          <MoreHorizontal size={16} />
        </Menu>
      )}
      <div style={{ flex: 1 }} />
      <div
        className={'option ' + (!props.isEmpty ? '' : 'disabled ')}
        onClick={() => !props.isEmpty && props.onSend && props.onSend()}
      >
        <Send size={16} />
      </div>
    </div>
  );
};
