import React, { useState, useEffect } from 'react';
import AutoComplete from 'components/AutoComplete/AutoComplete';
import EmojiService from 'services/emojis/emojis.js';
import UsersService from 'services/user/user.js';
import ChannelsService from 'services/channels/channels.js';
import WorkspacesUser from 'services/workspaces/workspaces_users.js';
import Emojione from 'components/Emojione/Emojione';
import Languages from 'services/languages/languages.js';
import User from 'components/User/User.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditors';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';

type Props = {
  onResize?: (evt: any) => void;
  onEscape?: (evt: any) => void;
  onPaste?: (evt: any) => any;
  onFocus?: () => void;
  autocompleteRef?: (node: any) => void;
  onEditLastMessage?: () => void;
  onChange?: (text: string) => void;
  onSend?: (text: string) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
  messageId: string;
  channelId: string;
  threadId: string;
};

export default (props: Props) => {
  const [content, setContent] = useState('');
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  messageEditorService.useListener(useState);
  useEffect(() => {
    focus();
    const val = messageEditorService.getContent(props.threadId, props.messageId || '');
    if (val) change(val);
  }, []);
  let autocomplete: any = null;
  let disable_enter: boolean = false;

  let autocompletes = [/\B@([\-+\w]+)$/, /\B#([a-zA-Z\u00C0-\u017F]+)$/, /\B:([\-+\w]+)$/];
  if (!props.disableApps) {
    autocompletes.push(/^\/([a-z0-9]*)$/);
  }

  const change = (text: string) => {
    messageEditorService.setContent(props.threadId, props.messageId || '', text);
    setContent(text);
    if (props.onChange) props.onChange(text);
  };

  const focus = () => {
    autocomplete.focus();
  };

  const onKeyUp = (event: any) => {
    if (
      event.key == 'ArrowUp' &&
      !messageEditorService.getContent(props.threadId, props.messageId || '')
    ) {
      //Edit last message from ourselve
      props.onEditLastMessage && props.onEditLastMessage();
    }
    disable_enter = false;
  };

  const onKeyPress = (evt: any) => {
    if (evt.key === 'Enter') {
      if (disable_enter) {
        evt.stopPropagation();
        evt.preventDefault();
        return;
      }
      disable_enter = true;
      if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();
        if (props.onSend && props.onSend(content)) {
          change('');
        }
      } else {
        var target = evt.target;
        var result = PseudoMarkdownCompiler.autoCompleteBulletList(target, true);
        if (result) {
          change(result);
        }
        evt.stopPropagation();
        evt.preventDefault();
      }
    }
  };

  const searchCommand = (text: any, cb: any) => {
    let commands: any[] = [];
    const apps = WorkspacesApps.getApps().map(app => {
      var _commands = ((app.display || {}).messages_module || {}).commands || [];
      _commands = _commands.map((co: any) => {
        return { command: '/' + app.simple_name + ' ' + co.command, description: co.description };
      });
      commands = commands.concat(_commands);
    });
    var res = commands.filter(co => co.command.startsWith('/' + text));
    cb(res);
  };

  return (
    <AutoComplete
      ref={(node: any) => {
        autocomplete = node;
        props.autocompleteRef && props.autocompleteRef(node);
      }}
      onResize={props.onResize}
      search={[
        (text: string, cb: any) => {
          WorkspacesUser.searchUserInWorkspace(text, cb);
        },
        (text: string, cb: any) => {
          ChannelsService.search(text, cb);
        },
        (text: string, cb: any) => {
          EmojiService.search(text, cb);
        },
        (text: string, cb: any) => {
          searchCommand(text, cb);
        },
      ]}
      max={[5, 5, 5, 20]}
      renderItemChoosen={[
        (item: any) => {
          return '@' + item.username + ' ';
        },
        (item: any) => {
          return (
            '#' + item.name.toLocaleLowerCase().replace(/[^a-z0-9_\-.\u00C0-\u017F]/g, '') + ' '
          );
        },
        (item: any) => {
          return item.native + ' ';
        },
        (item: any) => {
          return item.command.split('[')[0].split('"')[0];
        },
      ]}
      renderItem={[
        (item: any) => {
          return [
            <div className="icon">
              <User user={item} small />
            </div>,
            <div className="text">
              {UsersService.getFullName(item)}{' '}
              <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>@{item.username}</span>
            </div>,
          ];
        },
        (item: any) => {
          return [
            <div className="icon">
              <Emojione type={item.icon} />
            </div>,
            <div className="text">{item.name}</div>,
          ];
        },
        (item: any) => {
          return [
            <div className="icon">
              <Emojione type={item.native} />
            </div>,
            <div className="text">
              {item.colons}{' '}
              <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>{item.name}</span>
            </div>,
          ];
        },
        (item: any) => {
          return (
            <div>
              <b>{item.command.split(' ')[0]}</b> {item.command.split(' ').slice(1).join(' ')}
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
      value={content}
      small
      onChange={(evt: any) => {
        change(evt.target.value);
      }}
      onKeyPress={(evt: any) => onKeyPress(evt)}
      onKeyUp={(evt: any) => onKeyUp(evt)}
      onPaste={props.onPaste}
      position={'top'}
      onEscape={props.onEscape}
      onFocusChange={(status: boolean) => {
        if (status) {
          props.onFocus && props.onFocus();
        }
      }}
    />
  );
};
