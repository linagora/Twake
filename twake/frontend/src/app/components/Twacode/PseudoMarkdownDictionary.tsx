import React from 'react';

import Emojione from 'components/Emojione/Emojione';
import HighlightedCode from 'components/HighlightedCode/HighlightedCode.js';
import User from './blocks/User';
import Chan from './blocks/Chan';
import File from 'components/Drive/File';
import InputWithClipBoard from 'components/InputWithClipBoard/InputWithClipBoard.js';
import UserService from 'services/user/UserService';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

class PseudoMarkdownDictionary {
  counter: number = 0;
  render_block: { [key: string]: any } = {
    text_block_parent: {
      object: (child: any, _object: any, _event_container: any, text_transform: any) => (
        <span key={this.counter++} style={text_transform || {}}>
          {child}
        </span>
      ),
    },
    text: {
      object: (child: any, _object: any, _event_container: any, text_transform: any) => (
        <span key={this.counter++} style={text_transform || {}}>
          {child}
        </span>
      ),
    },
    br: {
      object: (child: any) => [
        <br key={this.counter++} />,
        <span key={this.counter++}>{child}</span>,
      ],
    },
    emoji: {
      object: (_child: any, object: any) => (
        <Emojione key={this.counter++} type={':' + (object.content || '') + ':'} />
      ),
    },
    user: {
      object: (_child: any, object: any) => {
        const data = (object.content || '').split(':');
        const id = object.id || data[1];
        const username = data[0];
        return [
          // FIX ME
          // Should we hide the user image? (hideUserImage props required)
          //@ts-ignore
          <User key={this.counter++} id={id} username={username} />,
          <span key={this.counter++}> </span>,
        ];
      },
    },
    channel: {
      object: (_child: any, object: any) => {
        const data = (object.content || '').split(':');
        const id = object.id || data[1];
        const name = data[0];
        return [
          <Chan key={this.counter++} id={id} name={name} />,
          <span key={this.counter++}> </span>,
        ];
      },
    },
    mcode: {
      object: (_child: any, object: any) => (
        <HighlightedCode key={this.counter++} className="multiline-code">
          {(object.content || '').trim()}
        </HighlightedCode>
      ),
    },
    icode: {
      object: (_child: any, object: any) => (
        <div key={this.counter++} className="inline-code">
          {(object.content || '').trim()}
        </div>
      ),
    },
    underline: { object: (child: any) => <div className="underline">{child}</div> },
    strikethrough: { object: (child: any) => <div className="strikethrough">{child}</div> },
    bold: { object: (child: any) => <div className="bold">{child}</div>, text_transform: {} },
    italic: { object: (child: any) => <div className="italic">{child}</div> },
    mquote: { object: (child: any) => <div className="multiline-quote">{child}</div> },
    quote: { object: (child: any) => <div className="one-line-quote">{child}</div> },
    nop: { object: (child: any) => child },
    url: {
      object: (child: any, object: any) => {
        if (!object.url && object.url !== undefined) {
          return (
            // eslint-disable-next-line jsx-a11y/anchor-is-valid
            <a key={this.counter++} href="#">
              {child}
            </a>
          );
        }
        let url = this.setUrlProtocol(object.url || object.content);
        if (object.user_identifier && UserService.getCurrentUser()) {
          let separator = '?';
          if (url.indexOf('?') > 0) {
            separator = '&';
          }
          url += separator + 'twake_user=' + UserService.getCurrentUser().id;
        }
        return (
          // eslint-disable-next-line react/jsx-no-target-blank
          <a key={this.counter++} target="_blank" href={url}>
            {child}
          </a>
        );
      },
    },
    markdown_link: {
      object: (_child: any, object: any) => {
        const linkData = object.content.split('](');
        const url = linkData[1] || '';

        return (
          // eslint-disable-next-line react/jsx-no-target-blank
          <a href={this.setUrlProtocol(url)} target="_BLANK">
            {linkData[0]}
          </a>
        );
      },
    },
    email: {
      object: (child: any, object: any) => (
        // eslint-disable-next-line react/jsx-no-target-blank
        <a key={this.counter++} target="_blank" href={'mailto:' + (object.content || '')}>
          {child}
        </a>
      ),
    },
    system: {
      object: (child: any) => <span style={{ color: '#888', fontSize: 13 }}>{child}</span>,
    },
    file: {
      object: (_child: any, object: any) => (
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
      object: (_child: any, object: any, _event_container: any) => (
        <img
          key={this.counter++}
          src={object.src}
          alt={object.alt || ''}
          className={'image twacode'}
        />
      ),
    },
    icon: {
      object: (_child: any, object: any) => <Emojione key={this.counter++} type={object.src} />,
    },
    progress_bar: {
      object: (_child: any, object: any) => (
        <div key={this.counter++} className="progress_bar">
          <div style={{ width: (object.progress || 0) + '%' }} />
        </div>
      ),
    },
    attachment: { object: (child: any) => <div className="attachment">{child}</div> },
    button: {
      object: (child: any, object: any, event_container: any) => {
        if (object.inline) {
          return (
            <div
              key={this.counter++}
              className={
                'interactive_element underline interactive_message_btn ' +
                (object.style === 'danger' ? 'danger ' : '') +
                (object.style === 'primary' ? 'primary ' : '')
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
              (object.style === 'danger' ? 'danger ' : '') +
              (object.style === 'default' ? 'default ' : '')
            }
            onClick={(evt: any) => {
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
      object: (_child: any, object: any) => (
        <InputWithClipBoard key={this.counter++} value={object.content || ''} disabled={false} />
      ),
    },
    input: {
      object: (_child: any, object: any, event_container: any) => (
        <Input
          key={this.counter++}
          type="text"
          className={
            'interactive_element interactive_message_input medium ' +
            (object.full_width ? 'full_width ' : '')
          }
          defaultValue={object.content || ''}
          placeholder={object.placeholder}
          onChange={(evt: any) => {
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
      object: (_child: any, object: any, event_container: any) => (
        <select
          key={this.counter++}
          className={
            'select interactive_element interactive_message_input medium ' +
            (object.full_width ? 'full_width ' : '')
          }
          onChange={evt => {
            const value = evt.target.value;
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
          <option disabled selected={object.values.filter((e: any) => e.selected).length === 0}>
            {object.title}
          </option>
          {object.values.map((item: any) => {
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

  setUrlProtocol(url: string) {
    let protocol = 'https';

    if ((url || '').indexOf('http://') >= 0) {
      protocol = 'http';
    }
    return protocol + '://' + (url || '').replace(/^(https?:\/\/)/, '');
  }
}

const service = new PseudoMarkdownDictionary();
export default service;
