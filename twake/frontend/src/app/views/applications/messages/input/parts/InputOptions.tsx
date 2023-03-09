/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { EditorState } from 'draft-js';
import { Smile, Video, MoreHorizontal, Paperclip, Type } from 'react-feather';
import { Button, Tooltip } from 'antd';
import EmojiPicker from 'components/emoji-picker/emoji-picker';
import Menu from 'components/menus/menu';
import MenusManager from 'app/components/menus/menus-manager';
import Languages from 'app/features/global/services/languages-service';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps';
import MessageEditorsManager from 'app/features/messages/services/message-editor-service-factory';
import EditorToolbar from 'app/components/rich-text-editor/editor-toolbar';
import { Application } from 'app/features/applications/types/application';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';

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
};

export default (props: Props) => {
  const [displayRichTextOptions, setDisplayRichTextOptions] = useState(false);
  const [, setDisplayFileMenu] = useState(false);
  const [, setDisplayEmojiMenu] = useState(false);
  const addon_menu: MenuItem[] = [];
  const addon_right_icon: any[] = [];
  const addon_files: any[] = [];
  const addon_calls: any[] = [];

  const apps = useCompanyApplications().applications.filter(
    (app: Application) => app.display?.twake?.chat?.input,
  );

  if (props.triggerApp) {
    if (apps.length > 0) {
      // eslint-disable-next-line array-callback-return
      apps.map((app: Application) => {
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
            text: app.identity?.name,
            onClick: (evt: unknown) => {
              props.triggerApp && props.triggerApp(app, undefined, evt);
            },
          };

          if (
            app.display?.twake?.chat?.input?.type === 'file' &&
            app?.identity?.code !== 'twake_drive'
          ) {
            addon_files.push(menu_item);
          } else if (
            app?.identity?.code === 'jitsi' ||
            app.display?.twake?.chat?.input?.type === 'call'
          ) {
            addon_calls.push(menu_item);
          } else if (app?.identity?.code !== 'twake_drive') {
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
  );

  const displayToolbar = () => {
    return displayRichTextOptions;
  };

  return (
    <div className="input-toolbar">
      <div className="input-options">
        {addon_files.length > 0 && (
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
                text: Languages.t('scenes.apps.messages.input.attach_file.from_computer'),
                onClick: () => {
                  MessageEditorsManager.get(props.channelId).openFileSelector(props.threadId);
                },
              },
              ...addon_files,
            ]}
          >
            <Tooltip
              placement="top"
              title={Languages.t('scenes.apps.messages.input.attach_file', [], 'Attach file(s)')}
            >
              <Button type="text" size="small" className="ant-btn-icon-only">
                <Paperclip size={16} />
              </Button>
            </Tooltip>
          </Menu>
        )}

        {addon_files.length === 0 && (
          <Tooltip
            placement="top"
            title={Languages.t('scenes.apps.messages.input.attach_file', [], 'Attach file(s)')}
          >
            <Button
              type="text"
              size="small"
              className="ant-btn-icon-only"
              onClick={() =>
                MessageEditorsManager.get(props.channelId).openFileSelector(props.threadId)
              }
            >
              <Paperclip size={16} />
            </Button>
          </Tooltip>
        )}

        {props.onAddEmoji && (
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
                      onChange={(emoji: unknown) => {
                        MenusManager.closeMenu();
                        props.onAddEmoji && props.onAddEmoji(emoji);
                      }}
                    />
                  );
                },
              },
            ]}
          >
            <Tooltip
              placement="top"
              title={Languages.t('scenes.apps.messages.input.emoji', [], 'Emoji')}
            >
              <Button type="text" size="small">
                <Smile size={16} />
              </Button>
            </Tooltip>
          </Menu>
        )}

        {addon_calls.length > 1 && (
          <Menu className="option" position="top" menu={addon_calls}>
            <Tooltip
              placement="top"
              title={Languages.t('scenes.apps.messages.input.start_call', [], 'Start a call')}
            >
              <Button type="text" size="small" className="ant-btn-icon-only">
                <Video size={16} />
              </Button>
            </Tooltip>
          </Menu>
        )}

        {addon_calls.length === 1 && (
          <Tooltip
            placement="top"
            title={Languages.t('scenes.apps.messages.input.start_call', [], 'Start a call')}
          >
            <Button
              type="text"
              size="small"
              className="ant-btn-icon-only option"
              onClick={evt => addon_calls[0].onClick(evt)}
            >
              <Video size={16} />
            </Button>
          </Tooltip>
        )}

        <Tooltip
          placement="top"
          title={
            displayRichTextOptions
              ? Languages.t('scenes.apps.messages.input.hide_formatting', [], 'Hide formatting')
              : Languages.t('scenes.apps.messages.input.show_formatting', [], 'Show formatting')
          }
        >
          <Button
            type="text"
            size="small"
            className={`option ant-btn-icon-only richtext ${
              displayRichTextOptions ? 'selected' : ''
            }`}
            onMouseDown={e => {
              e.preventDefault();
              setDisplayRichTextOptions(!displayRichTextOptions);
            }}
          >
            <Type size={16} />
          </Button>
        </Tooltip>

        {addon_right_icon.map((app: Application) => {
          return (
            <Button
              key={app.id}
              type="text"
              size="small"
              className="option"
              onClick={(evt: unknown) => {
                props.triggerApp && props.triggerApp(app, true, evt);
              }}
            >
              <div
                className="messages-input-app-icon"
                style={{
                  backgroundImage:
                    'url(' + (app.display?.twake?.chat?.input?.icon || app.identity?.icon) + ')',
                }}
              />
            </Button>
          );
        })}

        {addon_menu.length > 0 && (
          <Menu className="option" position="top" menu={addon_menu}>
            <Button type="text" size="small">
              <MoreHorizontal size={16} />
            </Button>
          </Menu>
        )}
      </div>

      {displayToolbar() && (
        <div className="input-options-toolbar">
          <div className="richtext-toolbar fade_in">
            <RichTextToolbar />
          </div>
        </div>
      )}
    </div>
  );
};
