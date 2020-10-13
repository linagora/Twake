import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione';
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
    this.counter = 0;
    this.render_block = {
      text_block_parent: {
        object: (child, object, event_container, text_transform) => (
          <span key={this.counter++} style={text_transform || {}}>
            {child}
          </span>
        ),
      },
      text: {
        object: (child, object, event_container, text_transform) => (
          <span key={this.counter++} style={text_transform || {}}>
            {child}
          </span>
        ),
      },
      br: {
        object: child => [<br key={this.counter++} />, <span key={this.counter++}>{child}</span>],
      },
      emoji: {
        object: (child, object) => (
          <Emojione key={this.counter++} type={':' + (object.content || '') + ':'} />
        ),
      },
      user: {
        object: (child, object) => {
          var data = (object.content || '').split(':');
          var id = object.id || data[1];
          var username = data[0];
          return [
            <User key={this.counter++} id={id} username={username} />,
            <span key={this.counter++}> </span>,
          ];
        },
      },
      channel: {
        object: (child, object) => {
          var data = (object.content || '').split(':');
          var id = object.id || data[1];
          var name = data[0];
          return [
            <Chan key={this.counter++} id={id} name={name} />,
            <span key={this.counter++}> </span>,
          ];
        },
      },
      mcode: {
        object: (child, object) => (
          <HighlightedCode key={this.counter++} className="multiline-code">
            {(object.content || '').trim()}
          </HighlightedCode>
        ),
      },
      icode: {
        object: (child, object) => (
          <div key={this.counter++} className="inline-code">
            {(object.content || '').trim()}
          </div>
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
            return (
              <a key={this.counter++} href="#">
                {child}
              </a>
            );
          }
          var url = this.setUrlProtocol(object.url || object.content);
          if (object.user_identifier && UserService.getCurrentUser()) {
            var separator = '?';
            if (url.indexOf('?') > 0) {
              separator = '&';
            }
            url += separator + 'twake_user=' + UserService.getCurrentUser().id;
          }
          return (
            <a key={this.counter++} target="_blank" href={url}>
              {child}
            </a>
          );
        },
      },
      markdown_link: {
        object: (_child, object) => {
          const linkData = object.content.split('](');
          const url = linkData[1] || '';

          return (
            <a href={this.setUrlProtocol(url)} target="_BLANK">
              {linkData[0]}
            </a>
          );
        },
      },
      email: {
        object: (child, object) => (
          <a key={this.counter++} target="_blank" href={'mailto:' + (object.content || '')}>
            {child}
          </a>
        ),
      },
      system: { object: child => <span style={{ color: '#888', fontSize: 13 }}>{child}</span> },
      file: {
        object: (child, object) => (
          <div className="drive_view grid inline-files">
            <File
              key={this.counter++}
              data={{ id: object.content || '' }}
              notInDrive={true}
              mini={object.mode === 'mini' ? true : false}
            />
          </div>
        ),
      },
      image: {
        object: (child, object, event_container) => (
          <img key={this.counter++} src={object.src} className={'image twacode'} />
        ),
      },
      icon: { object: (child, object) => <Emojione key={this.counter++} type={object.src} /> },
      progress_bar: {
        object: (child, object) => (
          <div key={this.counter++} className="progress_bar">
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
                key={this.counter++}
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
                      evt,
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
              key={this.counter++}
              type="button"
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
                    evt,
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
          <InputWithClipBoard key={this.counter++} value={object.content || ''} disabled={false} />
        ),
      },
      input: {
        object: (child, object, event_container) => (
          <Input
            key={this.counter++}
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
                evt,
              );
            }}
          />
        ),
      },
      select: {
        object: (child, object, event_container) => (
          <select
            key={this.counter++}
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
                evt,
              );
              if (object.action_id) {
                event_container.onAction(
                  'interactive_action',
                  object.action_id,
                  object.interactive_context || {},
                  value,
                  evt.target.value,
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

  setUrlProtocol(url) {
    let protocol = 'https';

    if ((url || '').indexOf('http://') >= 0) {
      protocol = 'http';
    }
    return protocol + '://' + (url || '').replace(/^(https?:\/\/)/, '');
  }
}

const service = new PseudoMarkdownDictionary();
export default service;
