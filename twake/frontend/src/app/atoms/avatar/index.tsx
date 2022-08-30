import React from 'react';
import _ from 'lodash';

// @ts-ignore

interface AvatarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'circle' | 'square';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  avatar?: string;
  icon?: JSX.Element;
  title?: string;
}

const gradients = [
  '#9F2EF4 15.98%, #F97D64 50.17%, #F6C533 82.97%',
  '#0099C0 12.87%, #0099C0 49.65%, #3DD5A8 84.94%',
  '#D3A6FF 15.1%, #B966B5 50.52%, #7E72C6 85.13%',
  '#E2EF54 14.56%, #FF5C66 47.57%, #6248D5 83.84%',
  '#FF5CF1 14.48%, #B38ADE 51.66%, #56CDDF 84.61%',
  '#75C192 14.48%, #70BDA0 51.66%, #21B59C 84.61%',
  '#FFA6AF 14.87%, #E62E40 50.07%, #AA0909 84.36%',
  '#335F50 14.87%, #47888C 50.07%, #08C992 84.36%',
  '#6CD97E 15.23%, #12B312 56.97%, #117600 84.49%',
  '#7DF1FA 14.84%, #2BB4D6 49.93%, #008AA2 82.63%',
  '#FFBF80 13.66%, #E66B2E 51.13%, #A64300 84.79%',
];

const getGradient = (title = '') => {
  let output = 0;
  for (let i = 0; i < title.length; i++) {
    output += title[i].charCodeAt(0);
  }
  return gradients[output % 11];
};

const sizes = { lg: 14, md: 11, sm: 9, xs: 6 };
const fontSizes = { lg: '2xl', md: 'lg', sm: 'md', xs: 'sm' };

export default function Avatar(props: AvatarProps) {
  const avatarType = props.type || 'circle';
  const avatarSize = sizes[props.size || 'md'];
  const fontSize = fontSizes[props.size || 'md'];
  const addedClassName = props.className || '';
  const avatarTitle = props.title || '';
  const restProps = _.omit(props, 'size', 'type', 'avatar', 'title', 'className', 'icon');

  let className = `w-${avatarSize} h-${avatarSize} ${
    avatarType === 'circle' ? 'rounded-full' : 'rounded-sm'
  } `;

  if (props.icon) {
    className += ' border border-gray-500 ';
    return (
      <div {...restProps} className={className + ' overflow-hidden ' + addedClassName}>
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

  className += ' border border-gray flex items-center justify-center bg-gradient-to-r ';

  const spl_title = avatarTitle.split(' ');

  let letters = avatarTitle.slice(0, 1);
  if (spl_title.length > 1) {
    letters = spl_title[0].slice(0, 1) + spl_title[1].slice(0, 1);
  }

  const lettersClass = `font-medium bg-gray text-white text-${fontSize}`;

  const style = { background: `linear-gradient(135deg, ${getGradient(props.title)})` };

  return (
    <div className={className + ' ' + addedClassName} {...restProps} style={style}>
      <div className={lettersClass}>{letters.toUpperCase()}</div>
    </div>
  );
}
