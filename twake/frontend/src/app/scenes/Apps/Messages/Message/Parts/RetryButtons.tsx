import React from 'react';
import { Button } from 'antd';
import Languages from 'services/languages/languages';

type Props = {};

export default (props: Props) => {
  return (
    <div>
      <Button
        style={{ fontWeight: 500, paddingLeft: 0 }}
        onClick={() => {
          //TODO: MessagesService.retrySendMessage(props.message, props.collectionKey);
        }}
      >
        {Languages.t('general.retry', [], 'Retry')}
      </Button>
      <Button
        style={{ fontWeight: 500 }}
        onClick={() => {
          //TODO: MessagesService.deleteMessage(props.message, props.collectionKey);
        }}
      >
        {Languages.t('general.cancel', [], 'Cancel')}
      </Button>
    </div>
  );
};
