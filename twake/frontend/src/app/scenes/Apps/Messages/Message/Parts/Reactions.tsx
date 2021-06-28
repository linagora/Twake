import React from 'react';
import User from 'services/user/UserService';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import 'moment-timezone';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Emojione from 'components/Emojione/Emojione';
import { Message } from 'app/services/Apps/Messages/Message';
import { Tooltip } from 'antd';

type PropsType = {
  message: Message;
  collectionKey: string;
};

type ReactionType = { name: string; count: number; users: string[] };

export default ({ message, collectionKey }: PropsType) => {
  const has_reactions =
    !message?.hidden_data?.disable_reactions && message?.reactions && message?.reactions.length > 0;

  if (!has_reactions) return <></>;

  const getReactionTooltip = (users: ReactionType['users']): JSX.Element[] =>
    users.map(id => {
      const user = Collections.get('users').find(id);

      if (!user) return <></>;

      const name = User.getFullName(user);

      return (
        <div key={id} style={{ whiteSpace: 'nowrap' }}>
          {name}
        </div>
      );
    });

  const setReactionClassname = (reaction: ReactionType): string => {
    const isSelected =
      message?._user_reaction === reaction.name || reaction.users.includes(User.getCurrentUserId());

    return `reaction ${isSelected ? 'is_selected' : ''}`;
  };

  const onClickReaction = (name: ReactionType['name']): void =>
    MessagesService.react(message, name, collectionKey);

  const mapReactions = (reaction: ReactionType, index: number): JSX.Element => {
    const noReactions: boolean = (reaction.count || 0) <= 0;
    const users: ReactionType['users'] = reaction.users || [];

    if (noReactions) return <></>;

    return (
      <Tooltip
        className="reaction_container"
        key={index}
        placement="top"
        title={getReactionTooltip(users)}
      >
        <div
          className={setReactionClassname(reaction)}
          onClick={() => onClickReaction(reaction.name)}
        >
          <Emojione type={reaction.name} />
          {reaction.count}
        </div>
      </Tooltip>
    );
  };

  const sortReactions = (a: string, b: string): number =>
    ((message?.reactions || {})[b]?.count || 0) - ((message?.reactions || {})[a]?.count || 0);

  return (
    <div className="reactions">{message?.reactions.sort(sortReactions).map(mapReactions)}</div>
  );
};
