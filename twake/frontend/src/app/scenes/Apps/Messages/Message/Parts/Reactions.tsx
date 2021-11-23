import React, { useContext } from 'react';
import User from 'services/user/UserService';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import 'moment-timezone';
import Emojione from 'components/Emojione/Emojione';
import { ReactionType } from 'app/models/Message';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { MessageContext } from '../MessageWithReplies';
import { useMessage } from 'app/state/recoil/hooks/useMessage';

type PropsType = {};

export default (_: PropsType) => {
  const context = useContext(MessageContext);
  let { message, react } = useMessage(context);

  const has_reactions =
    !message?.context?.disable_reactions && message?.reactions && message?.reactions.length > 0;

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

  const onClickReaction = (name: ReactionType['name']): void => {
    react([name], 'toggle');
  };

  const mapReactions = (reaction: ReactionType, index: number): JSX.Element => {
    const noReactions: boolean = (reaction.count || 0) <= 0;
    const users: ReactionType['users'] = reaction.users || [];

    if (noReactions) return <></>;

    const reactionClassName = classNames('reaction', {
      is_selected: reaction.users.includes(User.getCurrentUserId()),
    });

    return (
      <Tooltip
        className="reaction_container"
        key={index}
        placement="top"
        title={getReactionTooltip(users)}
      >
        <div className={reactionClassName} onClick={() => onClickReaction(reaction.name)}>
          <Emojione type={reaction.name} />
          {reaction.count}
        </div>
      </Tooltip>
    );
  };

  const sortReactions = (a: ReactionType, b: ReactionType): number => b.count || 0 - a.count;

  return (
    <div className="reactions">
      {(message?.reactions || [])?.sort(sortReactions).map(mapReactions)}
    </div>
  );
};
