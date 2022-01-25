import React, { useContext } from 'react';
import User from 'app/features/users/services/current-user-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import 'moment-timezone';
import Emojione from 'components/emojione/emojione';
import { ReactionType } from 'app/features/messages/types/message';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { MessageContext } from '../message-with-replies';
import { useMessage } from 'app/features/messages/hooks/use-message';
import _ from 'lodash';

export default () => {
  const context = useContext(MessageContext);
  let { message, react } = useMessage(context);

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
  react: Function;
}): JSX.Element => {
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
      <div className={reactionClassName} onClick={() => react([reaction.name], 'toggle')}>
        <Emojione type={reaction.name} />
        {reaction.count}
      </div>
    </Tooltip>
  );
};

const ReactionTooltip = ({ users }: { users: ReactionType['users'] }): JSX.Element => (
  <>
    {users.map(id => {
      const user = Collections.get('users').find(id);

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
