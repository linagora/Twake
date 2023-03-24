//@ts-nocheck
//We need this because of a bug in emoji_mart fallback implementationimport React, { Component } from 'react';

import React, { Component } from 'react';

import 'emoji-mart/css/emoji-mart.css';

import { getEmojiDataFromNative, Emoji } from 'emoji-mart';
import data from 'emoji-mart/data/all.json';

import emojione from 'emojione';
import Icon from 'components/icon/icon.js';

import './emojione.scss';
import { getAsFrontUrl } from 'app/features/global/utils/URLUtils';

type Props = {
  type: string;
  size?: number;
  className?: string;
  s64?: boolean;
  s128?: boolean;
  emoji?: string;
};

const type_to_uni: any = {};

const getFromEmojione = (props: Props) => {
  //Use from local server
  let html: string | '' = '';
  html = emojione.toImage(props.type || props.emoji || '');
  html = html?.replace('https://cdn.jsdelivr.net/emojione/assets/3.1/png/', '/public/emojione/');

  if (props.s64) {
    html = html?.replace('/32/', '/64/');
  } else if (props.s128) {
    html = html?.replace('/32/', '/128/');
  }
  return { __html: html };
};

class EmojioneFallback extends Component<Props> {
  // WIP
  render() {
    return (
      <i className={'emoji-container '} dangerouslySetInnerHTML={getFromEmojione(this.props)} />
    );
  }
}

const Emojione = React.memo((props: Props) => {
  if (typeof props.type != 'string') {
    return <></>;
  }

  if (props.type === 'trash') {
    return <Icon type="trash" className="trash_emoji" />;
  }

  if (props.type.substr(0, 7) === ':twake-') {
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

  if (props.type.substr(0, 7) === 'http://' || props.type.substr(0, 8) === 'https://') {
    return (
      <i
        className={'emojione emoji-image ' + (props.className || '')}
        style={{ backgroundImage: "url('" + props.type + "')" }}
      />
    );
  }

  let size = props.size || 16;
  if (size > 32 || props.s64 || props.s128) {
    return <EmojioneFallback {...props} />;
  }

  const uni =
    type_to_uni[props.type] ||
    //@ts-ignore
    getEmojiDataFromNative(emojione.shortnameToUnicode(props.type), 'apple', data);
  type_to_uni[props.type] = uni;

  return (
    <span className={'emoji-container emoji-text ' + (props.className || '')}>
      <Emoji
        backgroundImageFn={set => {
          if ([16, 20, 32, 64].indexOf(size) < 0) {
            size = 64;
          }
          return getAsFrontUrl(
            '/public/emoji-datasource/'.concat(set, '/sheets-256/').concat(size, '.png'),
          );
        }}
        emoji={uni || props.type}
        set="apple"
        size={size}
        fallback={() => <EmojioneFallback {...props} />}
      />
    </span>
  );
});

export default Emojione;
