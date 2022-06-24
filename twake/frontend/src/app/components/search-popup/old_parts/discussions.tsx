import Search from 'features/global/services/search-service';
import React from 'react';
import MessagesResult from 'app/components/search-popup/old_parts/messages-result';
import { MessageExtended } from 'features/messages/types/message';

type PropsType = {
  title: string;
  messages: MessageExtended[];
  limit: number;
};

export default ({ title, messages, limit }: PropsType): JSX.Element => {
  if (!messages) {
    return <div />;
  }

  return (
    <div>
      <div className="results-group-title ">{title}</div>
      <div className="result-items">
        {messages.slice(0, limit).map(message => (
          <MessagesResult
            key={message.id}
            message={message}
            highlight={Search.value}
            onClick={() => Search.close()}
          />
        ))}
      </div>
    </div>
  );
};
