import React, { useState, useEffect } from 'react';
import AutoComplete from 'components/AutoComplete/AutoComplete.js';
import EmojiService from 'services/emojis/emojis.js';
import UsersService from 'services/user/user.js';
import ChannelsService from 'services/channels/channels.js';
import WorkspacesUser from 'services/workspaces/workspaces_users.js';
import Emojione from 'components/Emojione/Emojione.js';
import Languages from 'services/languages/languages.js';
import User from 'components/User/User.js';
import LocalStorage from 'services/localStorage.js';
import InputOptions from './Parts/InputOptions';
import './Input.scss';

type Props = {
  onResize?: (evt: any) => void;
  onEscape?: (evt: any) => void;
  onFocus?: () => void;
  ref?: (node: any) => void;
  onChange?: (text: string) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
};

export default (props: Props) => {
  const [content, setContent] = useState('');
  useEffect(() => {
    focus();
  }, []);
  let autocomplete: any = null;

  let autocompletes = [/\B@([\-+\w]+)$/, /\B#([a-zA-Z\u00C0-\u017F]+)$/, /\B:([\-+\w]+)$/];
  if (!props.disableApps) {
    autocompletes.push(/^\/([a-z0-9]*)$/);
  }

  props.localStorageIdentifier &&
    LocalStorage.getItem('m_input_' + props.localStorageIdentifier, (res: string) => {
      if (!content && res) {
        setContent(res);
      }
    });

  const change = (text: string) => {
    props.localStorageIdentifier &&
      LocalStorage.setItem('m_input_' + props.localStorageIdentifier, text);
    setContent(text);
    if (props.onChange) props.onChange(text);
  };

  const focus = () => {
    autocomplete.focus();
  };

  const onKeyPress = (event: any) => {};

  const onKeyUp = (event: any) => {};

  const searchCommand = (event: any, cb: any) => {};

  return (
    <div className="message-input" ref={props.ref}>
      <AutoComplete
        ref={(node: any) => {
          autocomplete = node;
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
                <span style={{ opacity: '0.5', textTransform: 'capitalize' }}>
                  @{item.username}
                </span>
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
        position={'top'}
        onEscape={props.onEscape}
        onFocusChange={(status: boolean) => {
          if (status) {
            props.onFocus && props.onFocus();
          }
        }}
      />

      <InputOptions />
    </div>
  );
};
