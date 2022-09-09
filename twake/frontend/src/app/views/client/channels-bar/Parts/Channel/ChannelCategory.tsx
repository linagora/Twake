import React, { FC } from 'react';
import Icon from 'app/components/icon/icon';
import './Channel.scss';

type PropsType = {
  text?: string;
  editable?: boolean;
  refAdd?: React.LegacyRef<HTMLDivElement> | undefined;
  sub?: boolean;
  onClick?: () => void;
  onAdd?: () => void;
  suffix?: string;
  addIcon?: JSX.Element;
};

const ChannelCategory: FC<PropsType> = (props): JSX.Element => {
  return (
    <div
      className={'channel_category ' + (props.sub ? 'sub ' : '')}
      onClick={() => props.editable && props.onClick && props.onClick()}
    >
      <div className="text">{props.text}</div>
      {props.sub && props.editable && (
        <div className="edit">
          <Icon type="edit-alt" />
        </div>
      )}
      {props.onAdd && (
        <div ref={props.refAdd} className="add" onClick={props.onAdd}>
          {props.addIcon || <Icon type="plus" />}
        </div>
      )}
      {props.suffix && props.suffix}
    </div>
  );
};

export default ChannelCategory;
