import React from 'react';
import 'emoji-mart/css/emoji-mart.css';

import { getEmojiDataFromNative, Emoji } from 'emoji-mart';
import data from 'emoji-mart/data/all.json';

import emojione from 'emojione';
import Icon from 'components/Icon/Icon.js';

import './Emojione.scss';

type Props = {
  type: string;
  size?: number;
  className?: string;
  s64?: boolean;
  s128?: boolean;
}

const type_to_uni: any = {};

export default React.memo((props: Props) => {
  if (typeof props.type != 'string') {
    return <></>;
  }

  if (props.type == 'trash') {
    return <Icon type="trash" className="trash_emoji" />;
  }

  if (props.type.substr(0, 7) == ':twake-') {
    return (
      <i
        className={'emojione emoji-image ' + (props.className || '')}
        style={{
          backgroundImage:
            "url('/public/img/twake-emoji/" + props.type.replace(/:/g, '') + ".png')",
        }}
      />
    );
  }

  if (props.type.substr(0, 7) == 'http://' || props.type.substr(0, 8) == 'https://') {
    return (
      <i
        className={'emojione emoji-image ' + (props.className || '')}
        style={{ backgroundImage: "url('" + props.type + "')" }}
      />
    );
  }

  let size = props.size || 16;
  let html = "";

  if (size > 32 || props.s64 || props.s128) {
    //Use from local server
    html = emojione.toImage(props.type);
    html = html.replace('https://cdn.jsdelivr.net/emojione/assets/3.1/png/', '/public/emojione/');
    
    if (props.s64) {
      size = 32;
      html = html.replace('/32/', '/64/');
    } else if (props.s128) {
      size = 64;
      html = html.replace('/32/', '/128/');
    }

    const fb = (
      <i
        className={'emoji-container ' + (props.className || '')}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    return fb;
  }

  console.log();

  //@ts-ignore
  const uni = type_to_uni[props.type] || getEmojiDataFromNative(emojione.shortnameToUnicode(props.type), 'apple', data);
  type_to_uni[props.type] = uni;

  return (
    <span className={'emoji-container emoji-text ' + (props.className || '')}>
      <Emoji emoji={uni || props.type} set="apple" size={size} />
    </span>
  );
});
