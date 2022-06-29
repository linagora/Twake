import React from 'react';
import '../search-popup.scss';
import { UserType } from 'features/users/types/user';
import User from 'features/users/services/current-user-service';
import { useDirectChannels } from 'features/channels/hooks/use-direct-channels';
import assert from 'assert';
import { highlightText } from 'app/components/search-popup/common';

type PropsType = {
  user: UserType;
  highlight: string;
  onClick: any;
};

export default ({ user, highlight, onClick }: PropsType): JSX.Element => {
  const { openDiscussion } = useDirectChannels();

  const thumbnail =
    User.getThumbnail(user) ||
    'data:image/svg+xml;base64, PHN2ZyB3aWR0aD0iNTciIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NyA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjguOTk2MSIgY3k9IjI4IiByPSIyOCIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzk1Ml82ODM4NSkiLz4KPGNpcmNsZSBjeD0iMjguOTk2MSIgY3k9IjI4IiByPSIyNy43NSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLW9wYWNpdHk9IjAuMDgiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfOTUyXzY4Mzg1IiB4MT0iMjguOTk2MSIgeTE9IjAiIHgyPSIyOC45OTYxIiB5Mj0iNTYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzZFRDFGQiIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMyNkE0RjgiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K';

  const onItemClick = async () => {
    assert(user.id);
    await openDiscussion([user.id]);
    onClick();
  };

  return (
    <div className="result-item" onClick={onItemClick}>
      <div className="result-item-icon">
        <div>
          <img className="result-item-icon-back" src={thumbnail} />
        </div>
      </div>
      <div className="result-item-content">
        <div className="channel-title">
          <span
            dangerouslySetInnerHTML={{ __html: highlightText(user.first_name, highlight) }}
          ></span>{' '}
          <span
            dangerouslySetInnerHTML={{ __html: highlightText(user.last_name, highlight) }}
          ></span>
        </div>
        <div
          className="channel-description"
          dangerouslySetInnerHTML={{ __html: highlightText(user.email, highlight) }}
        ></div>
      </div>
      <div className="result-item-postfix"></div>
    </div>
  );
};
