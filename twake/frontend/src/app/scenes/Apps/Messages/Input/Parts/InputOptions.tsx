import React, { useState } from 'react';
import { EditorState } from 'draft-js';
import { Smile, Video, MoreHorizontal, Paperclip, Type } from 'react-feather';
import { Button, Tooltip } from 'antd';
import EmojiPicker from 'components/EmojiPicker/EmojiPicker';
import Menu from 'components/Menus/Menu';
import MenusManager from 'app/components/Menus/MenusManager';
import Languages from 'services/languages/languages';
import WorkspacesApps from 'services/workspaces/workspaces_apps';
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

type MenuItem = {
  type: string;
  emoji?: any;
  icon?: any;
  text?: string;
  onClick?: (event: Event) => void;
}

export default (props: Props) => {
  const [displayRichTextOptions, setDisplayRichTextOptions] = useState(false);
  const [displayFileMenu, setDisplayFileMenu] = useState(false);
  const [displayFileMenuTooltip, setDisplayFileMenuTooltip] = useState(false);
  const [displayEmojiMenu, setDisplayEmojiMenu] = useState(false);
  const [displayEmojiMenuTooltip, setDisplayEmojiMenuTooltip] = useState(false);
  const addon_menu: MenuItem[] = [];
  const addon_right_icon: any[] = [];
  const addon_files: any[] = [];
  const addon_calls: any[] = [];
  const apps = WorkspacesApps.getApps().filter(
    app => app.display?.messages_module?.in_plus || app.display?.messages_module?.right_icon,
  );

  if (props.triggerApp) {
    if (apps.length > 0) {
      apps.map(app => {
        if (app) {
          let icon = WorkspacesApps.getAppIcon(app);
          let emoji = '';
          if ((icon || '').indexOf('http') === 0) {
            emoji = icon;
            icon = '';
          }
          const menu_item: MenuItem = {
            type: 'menu',
            emoji,
            icon,
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
  }

  const RichTextToolbar = () => (
    <EditorToolbar
      editorState={props.richTextEditorState}
      onChange={editorState => props.onRichTextChange(editorState)}
    />
  )

  const displayToolbar = () => {
    return displayRichTextOptions;
  }

  return (
    <div className="input-toolbar">
      <div className="input-options">
        <div className="files"
          onMouseEnter={() => setDisplayFileMenuTooltip(true)}
          onMouseLeave={() => setDisplayFileMenuTooltip(false)}
        >
          <Tooltip
            placement="top"
            title={Languages.t("scenes.apps.messages.input.attach_file", [], "Attach file(s)")}
            visible={displayFileMenuTooltip && !displayFileMenu}
          >
            <Button type="text" size="small" className="ant-btn-icon-only">
              <Menu
                className="option"
                position="top"
                toggle={true}
                onOpen={() => setDisplayFileMenu(true)}
                onClose={() => setDisplayFileMenu(false)}
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
          </Tooltip>
        </div>

        {props.onAddEmoji && (
          <div className="emojis"
            onMouseEnter={() => setDisplayEmojiMenuTooltip(true)}
            onMouseLeave={() => setDisplayEmojiMenuTooltip(false)}
          >
            <Tooltip
              placement="top"
              title={Languages.t("scenes.apps.messages.input.emoji", [], "Emoji")}
              visible={displayEmojiMenuTooltip && !displayEmojiMenu}
            >
              <Button type="text" size="small">
                <Menu
                  className="option"
                  position="top"
                  toggle={true}
                  onOpen={() => setDisplayEmojiMenu(true)}
                  onClose={() => setDisplayEmojiMenu(false)}
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
                >
                  <Smile size={16} />
                </Menu>
              </Button>
            </Tooltip>
          </div>
        )}

        {addon_calls.length > 1 && (
          <Tooltip placement="top" title={Languages.t("scenes.apps.messages.input.start_call", [], "Start a call")}>
            <Button type="text" size="small" className="ant-btn-icon-only">
              <Menu className="option" position="top" menu={addon_calls}>
                <Video size={16} />
              </Menu>
            </Button>
          </Tooltip>
        )}

        {addon_calls.length === 1 && (
          <Tooltip placement="top" title={Languages.t("scenes.apps.messages.input.start_call", [], "Start a call")}>
            <Button type="text" size="small" className="ant-btn-icon-only">
              <div className="option" onClick={evt => addon_calls[0].onClick(evt)}>
                <Video size={16} />
              </div>
            </Button>
          </Tooltip>
        )}

        <Tooltip placement="top"
          title={displayRichTextOptions
            ? Languages.t("scenes.apps.messages.input.hide_formatting", [], "Hide formatting")
            : Languages.t("scenes.apps.messages.input.show_formatting", [], "Show formatting")
          }>
          <Button type="text" size="small" className={`ant-btn-icon-only richtext ${displayRichTextOptions ? "selected" : ""}`}>
            <Type
              size={16}
              className="option"
              onMouseDown={(e) => {
                e.preventDefault();
                setDisplayRichTextOptions(!displayRichTextOptions);
              }}
            />
          </Button>
        </Tooltip>

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
        
        {addon_menu.length > 0 && (
          <Button type="text" size="small">
            <Menu className="option" position="top" menu={addon_menu}>
              <MoreHorizontal size={16} />
            </Menu>
          </Button>
        )}
      </div>

      <div className="input-options-toolbar">
        {
          displayToolbar() && (
          <>
            <div className="input-options-toolbar-separator"></div>
            <div className="richtext-toolbar">
              <RichTextToolbar />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
