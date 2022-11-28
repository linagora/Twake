import React, { useContext } from 'react';
import User from 'app/features/users/services/current-user-service';
import 'moment-timezone';
import Emojione from 'components/emojione/emojione';
import { ReactionType } from 'app/features/messages/types/message';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import { getUser } from 'app/features/users/hooks/use-user-list';
import { MessagesListContext } from '../../messages-list';

export default () => {
  const context = useContext(MessageContext);
  const { message, react } = useMessage(context);

  if (
    !(!message?.context?.disable_reactions && message?.reactions && message?.reactions.length > 0)
  )
    return <></>;

  return (
    <div className="reactions">
      {(message?.reactions || [])
        .map(r => r) //To avoid modifing the original one with sort
        .sort((a, b) => b.count || 0 - a.count)
        .map((reaction, index) => (
          <Reaction reaction={reaction} react={react} key={index} />
        ))}
    </div>
  );
};

const Reaction = ({
  reaction,
  react,
}: {
  reaction: ReactionType;
  react: (emojis: string[], mode?: 'add' | 'toggle' | 'remove' | 'replace') => Promise<void>;
}): JSX.Element => {
  const listContext = useContext(MessagesListContext);
  const noReactions: boolean = (reaction.count || 0) <= 0;
  const users: ReactionType['users'] = reaction.users || [];

  if (noReactions) return <></>;

  const reactionClassName = classNames('reaction', {
    is_selected: reaction.users.includes(User.getCurrentUserId()),
  });

  return (
    <Tooltip
      className="reaction_container"
      placement="top"
      title={<ReactionTooltip users={users} />}
    >
      <div
        className={reactionClassName}
        onClick={() => {
          if (!listContext.readonly) react([reaction.name], 'toggle');
        }}
      >
        <Emojione type={reaction.name} />
        {reaction.count}
      </div>
    </Tooltip>
  );
};

const ReactionTooltip = ({ users }: { users: ReactionType['users'] }): JSX.Element => (
  <>
    {users.map(id => {
      const user = getUser(id);

      if (!user) return <></>;

      const name = User.getFullName(user);

      return (
        <div key={id} style={{ whiteSpace: 'nowrap' }}>
          {name}
        </div>
      );
    })}
  </>
);
