import { Skeleton } from 'antd';
import React from 'react';

export const MessagesPlaceHolder = () => {
  return (
    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
      <div
        className="messages-placeholder thread-container"
        style={{ flex: 1, overflow: 'hidden', bottom: '0px', position: 'absolute', width: '100%' }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="thread-centerer">
            <Skeleton avatar></Skeleton>
          </div>
        ))}{' '}
      </div>
    </div>
  );
};
