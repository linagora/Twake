import React from 'react';
import _ from 'lodash';
import CryptoJS from 'crypto-js';

// @ts-ignore

interface AvatarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'circle' | 'square';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  avatar?: string;
  icon?: JSX.Element;
  title?: string;
}

const sizes = { lg: 14, md: 11, sm: 9, xs: 6 };
const fontSizes = { lg: '2xl', md: 'lg', sm: 'md', xs: 'sm' };

export const getGradient = (name: string) => {
  const seed = parseInt(CryptoJS.MD5(name).toString().slice(0, 8), 16);
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = 254;
  canvas.height = 254;
  const ctx = canvas.getContext('2d');
  const gradient = ctx!.createLinearGradient(254, 254, 0, 0);
  gradient.addColorStop(0, 'hsl(' + seed + ', 90%, 70%)');
  gradient.addColorStop(1, 'hsl(' + Math.abs(seed - 60) + ', 90%, 70%)');
  ctx!.fillStyle = gradient;
  ctx!.fillRect(0, 0, 254, 254);
  const b64 = canvas.toDataURL('image/jpeg');
  return b64;
};

export default function Avatar(props: AvatarProps) {
  const avatarType = props.type || 'circle';
  const avatarSize = sizes[props.size || 'md'];
  const fontSize = fontSizes[props.size || 'md'];
  const addedClassName = props.className || '';
  const avatarTitle = props.title || '';
  const restProps = _.omit(props, 'size', 'type', 'avatar', 'title', 'className', 'icon');

  let className = `border border-solid border-zinc-200 dark:border-zinc-700 w-${avatarSize} h-${avatarSize} ${
    avatarType === 'circle' ? 'rounded-full' : 'rounded-sm'
  } `;

  className +=
    ' border border-gray flex items-center justify-center bg-gradient-to-r bg-center bg-cover ';

  const spl_title = avatarTitle.split(' ');

  let letters = avatarTitle.slice(0, 1);
  if (spl_title.length > 1) {
    letters = spl_title[0].slice(0, 1) + spl_title[1].slice(0, 1);
  }

  const lettersClass = `font-medium bg-gray text-white text-${fontSize}`;

  const style = { backgroundImage: `url('${getGradient(props.title || '')}')` };

  if (props.icon) {
    className += ' ';
    return (
      <div
        {...restProps}
        style={style}
        className={
          className +
          ' text-white overflow-hidden flex items-center justify-center ' +
          addedClassName
        }
      >
        {props.icon}
      </div>
    );
  }

  if (props.avatar) {
    return (
      <div {...restProps}>
        <img
          alt={props.title}
          src={props.avatar}
          className={className + ' object-cover ' + addedClassName}
        />
      </div>
    );
  }

  return (
    <div className={className + ' ' + addedClassName} {...restProps} style={style}>
      <div className={lettersClass}>{letters.toUpperCase()}</div>
    </div>
  );
}
