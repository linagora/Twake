import { Skeleton } from 'antd';
import React from 'react';

export const MessagesPlaceholder = () => {
  return (
    <div
      className="messages-placeholder thread-container loading-blink"
      style={{ flex: 1, overflow: 'hidden', bottom: '0px', position: 'absolute', width: '100%' }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <div key={i} className="thread-centerer">
          <Skeleton avatar></Skeleton>
        </div>
      ))}{' '}
    </div>
  );
};
