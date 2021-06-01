import React, { useState } from 'react';
import { EditorState } from 'draft-js';
import { Smile, Video, MoreHorizontal, Paperclip, Type } from 'react-feather';
import { Button } from 'antd';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import Languages from 'services/languages/languages.js';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import WorkspaceParameter from 'app/scenes/Client/Popup/WorkspaceParameter/WorkspaceParameter.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import EditorToolbar from 'app/components/RichTextEditor/EditorToolbar';

type Props = {
  channelId: string;
  threadId: string;
  onAddEmoji?: (emoji: any) => void;
  onSend?: () => void;
  triggerApp?: (app: any, fromIcon: any, evt: any) => void;
  isEmpty: boolean;
  onRichTextChange: (editorState: EditorState) => void;
  richTextEditorState: EditorState;
};

export default (props: Props) => {
  const [displayRichText, setDisplayRichText] = useState(false);
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
        if (app) {
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

  const RichTextToolbar = () => (
    <EditorToolbar
      editorState={props.richTextEditorState}
      onChange={editorState => props.onRichTextChange(editorState)}
    />
  )

  const toggleEditionMode = () => {
    setDisplayRichText(!displayRichText);
  }

  return (
    <div className="input-toolbar">
      <div className="input-options">
        <Button type="text" size="small">
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
        </Button>

        {props.onAddEmoji && (
          <Button type="text" size="small">
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
          </Button>
        )}
        {addon_calls.length > 1 && (
          <Button type="text" size="small">
            <Menu className="option" position="top" menu={addon_calls}>
              <Video size={16} />
            </Menu>
          </Button>
        )}
        {addon_calls.length === 1 && (
          <Button type="text" size="small">
            <div className="option" onClick={evt => addon_calls[0].onClick(evt)}>
              <Video size={16} />
            </div>
          </Button>
        )}

        {addon_right_icon.map((app: any) => {
          return (
            <Button type="text" size="small">
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
            </Button>
          );
        })}
        
        <Button type="text" size="small">
          <Type
            size={16}
            className="option"
            onMouseDown={(e) => {
              e.preventDefault();
              toggleEditionMode();
            }}
          />
        </Button>

        {addon_menu.length > 0 && (
          <Button type="text" size="small">
            <Menu className="option" position="top" menu={addon_menu}>
              <MoreHorizontal size={16} />
            </Menu>
          </Button>
        )}
        <div style={{ flex: 1 }} />
      </div>
      <div className="input-options-toolbar">
        {displayRichText && <RichTextToolbar />}
      </div>
    </div>
  );
};
