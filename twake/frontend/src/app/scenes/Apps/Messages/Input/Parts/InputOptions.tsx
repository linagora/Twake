import React from 'react';
import { Send, Smile, AlignLeft, Video, MoreHorizontal, Paperclip } from 'react-feather';

type Props = {};

export default (props: Props) => {
  return (
    <div className="input-options">
      <div className="option">
        <Paperclip size={16} />
      </div>
      <div className="option">
        <Smile size={16} />
      </div>
      <div className="option">
        <Video size={16} />
      </div>
      <div className="option">
        <AlignLeft size={16} />
      </div>
      <div className="option">
        <MoreHorizontal size={16} />
      </div>
      <div style={{ flex: 1 }} />
      <div className="option disabled">
        <Send size={16} />
      </div>
    </div>
  );
};
