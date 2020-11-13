import React, { useState, FunctionComponent } from 'react';

type Props = {
  messagesListService: any;
};

const ScrollerParent: FunctionComponent<Props> = ({ messagesListService, children }) => {
  messagesListService.useListener(useState);
  return (
    <div
      className={
        'messages-scroller-parent ' +
        (messagesListService.showScrollDown ? 'scrolled-up-100 ' : '') +
        (messagesListService.showGradient ? 'scrolled-up ' : '')
      }
    >
      {children}
    </div>
  );
};

export default ScrollerParent;
