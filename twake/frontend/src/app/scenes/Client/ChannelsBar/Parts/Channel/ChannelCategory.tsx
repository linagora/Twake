import React, { FC } from 'react';
import Icon from 'components/Icon/Icon';
import './Channel.scss';

type PropsType = {
  text?: string;
  editable?: any;
  refAdd?: any;
  sub?: any;
  onClick?: any;
  onAdd?: any;
  suffix?: any;
};

const ChannelCategory: FC<PropsType> = (props): JSX.Element => {
  return (
    <div
      className={'channel_category ' + (props.sub ? 'sub ' : '')}
      onClick={props.editable && props.onClick}
    >
      <div className="text">{props.text}</div>
      {props.sub && props.editable && (
        <div className="edit">
          <Icon type="edit-alt" />
        </div>
      )}
      {props.onAdd && (
        <div ref={props.refAdd} className="add" onClick={props.onAdd}>
          <Icon type="plus" />
        </div>
      )}
      {props.suffix && props.suffix}
    </div>
  );
};

export default ChannelCategory;
