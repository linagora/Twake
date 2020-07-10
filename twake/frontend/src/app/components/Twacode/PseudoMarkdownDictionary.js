import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione.js';
import HighlightedCode from 'components/HighlightedCode/HighlightedCode.js';
import File from 'components/Drive/File.js';
import User from './blocks/User.js';
import Chan from './blocks/Chan.js';
import InputWithClipBoard from 'components/InputWithClipBoard/InputWithClipBoard.js';
import UserService from 'services/user/user.js';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

class PseudoMarkdownDictionary {
  constructor() {
    this.render_block = {
      text_block_parent: {
        object: (child, object, event_container, text_transform) => (
          <span style={text_transform || {}}>{child}</span>
        ),
      },
      text: {
        object: (child, object, event_container, text_transform) => (
          <span style={text_transform || {}}>{child}</span>
        ),
      },
      br: { object: child => [<br />, child] },
      emoji: { object: (child, object) => <Emojione type={':' + (object.content || '') + ':'} /> },
      user: {
        object: (child, object) => {
          var data = (object.content || '').split(':');
          var id = object.id || data[1];
          var username = data[0];
          return [<User id={id} username={username} />, ' '];
        },
      },
      channel: {
        object: (child, object) => {
          var data = (object.content || '').split(':');
          var id = object.id || data[1];
          var name = data[0];
          return [<Chan id={id} name={name} />, ' '];
        },
      },
      mcode: {
        object: (child, object) => (
          <HighlightedCode className="multiline-code">
            {(object.content || '').trim()}
          </HighlightedCode>
        ),
      },
      icode: {
        object: (child, object) => (
          <div className="inline-code">{(object.content || '').trim()}</div>
        ),
      },
      underline: { object: child => <div className="underline">{child}</div> },
      strikethrough: { object: child => <div className="strikethrough">{child}</div> },
      bold: { object: child => <div className="bold">{child}</div>, text_transform: {} },
      italic: { object: child => <div className="italic">{child}</div> },
      mquote: { object: child => <div className="multiline-quote">{child}</div> },
      quote: { object: child => <div className="one-line-quote">{child}</div> },
      nop: { object: child => child },
      url: {
        object: (child, object) => {
          if (!object.url && object.url !== undefined) {
            return <a>{child}</a>;
          }
          var orig_url =
            'http://' + (object.url || object.content || '').replace(/^(https?:\/\/)/, '');
          var url = orig_url;
          if (object.user_identifier && UserService.getCurrentUser()) {
            var separator = '?';
            if (url.indexOf('?') > 0) {
              separator = '&';
            }
            url += separator + 'twake_user=' + UserService.getCurrentUser().id;
          }
          return (
            <a target="_blank" href={url || orig_url}>
              {child}
            </a>
          );
        },
      },
      email: {
        object: (child, object) => (
          <a target="_blank" href={'mailto:' + (object.content || '')}>
            {child}
          </a>
        ),
      },
      system: { object: child => <span style={{ color: '#888', fontSize: 13 }}>{child}</span> },
      file: {
        object: (child, object) => (
          <div className="drive_view grid" style={{ marginTop: 5 }}>
            <File
              data={{ id: object.content || '' }}
              notInDrive={true}
              style={{ marginBottom: 0 }}
            />
          </div>
        ),
      },
      image: {
        object: (child, object, event_container) => (
          <img src={object.src} className={'image twacode'} />
        ),
      },
      icon: { object: (child, object) => <Emojione type={object.src} /> },
      progress_bar: {
        object: (child, object) => (
          <div className="progress_bar">
            <div style={{ width: (object.progress || 0) + '%' }} />
          </div>
        ),
      },
      attachment: { object: child => <div className="attachment">{child}</div> },
      button: {
        object: (child, object, event_container) => {
          if (object.inline) {
            return (
              <div
                className={
                  'interactive_element underline interactive_message_btn ' +
                  (object.style == 'danger' ? 'danger ' : '') +
                  (object.style == 'primary' ? 'primary ' : '')
                }
                onClick={evt => {
                  if (object.action_id) {
                    event_container.onAction(
                      'interactive_action',
                      object.action_id,
                      object.interactive_context || {},
                      '',
<<<<<<< HEAD
                      evt
=======
                      evt,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    );
                  }
                }}
              >
                {child}
              </div>
            );
          }
          return (
            <Button
              type="submit"
              className={
                'button interactive_element interactive_message_btn small ' +
                (object.style == 'danger' ? 'danger ' : '') +
                (object.style == 'default' ? 'default ' : '')
              }
              onClick={evt => {
                if (object.action_id) {
                  event_container.onAction(
                    'interactive_action',
                    object.action_id,
                    object.interactive_context || {},
                    '',
<<<<<<< HEAD
                    evt
=======
                    evt,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  );
                }
              }}
            >
              {child}
            </Button>
          );
        },
      },
      copiable: {
        object: (child, object) => (
          <InputWithClipBoard value={object.content || ''} disabled={false} />
        ),
      },
      input: {
        object: (child, object, event_container) => (
          <Input
            type="text"
            className={
              'interactive_element interactive_message_input medium ' +
              (object.full_width ? 'full_width ' : '')
            }
            defaultValue={object.content || ''}
            placeholder={object.placeholder}
            onChange={evt => {
              event_container.onAction(
                'interactive_change',
                object.passive_id,
                object.interactive_context || {},
                evt.target.value,
<<<<<<< HEAD
                evt
=======
                evt,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              );
            }}
          />
        ),
      },
      select: {
        object: (child, object, event_container) => (
          <select
            className={
              'select interactive_element interactive_message_input medium ' +
              (object.full_width ? 'full_width ' : '')
            }
            onChange={evt => {
              var value = evt.target.value;
              event_container.onAction(
                'interactive_change',
                object.passive_id || object.action_id,
                object.interactive_context || {},
                value,
<<<<<<< HEAD
                evt
=======
                evt,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              );
              if (object.action_id) {
                event_container.onAction(
                  'interactive_action',
                  object.action_id,
                  object.interactive_context || {},
                  value,
<<<<<<< HEAD
                  evt.target.value
=======
                  evt.target.value,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                );
              }
            }}
          >
            <option disabled selected={object.values.filter(e => e.selected).length == 0}>
              {object.title}
            </option>
            {object.values.map(item => {
              return (
                <option value={item.value} selected={item.selected}>
                  {item.name}
                </option>
              );
            })}
          </select>
        ),
      },
    };
  }
}

const service = new PseudoMarkdownDictionary();
export default service;
