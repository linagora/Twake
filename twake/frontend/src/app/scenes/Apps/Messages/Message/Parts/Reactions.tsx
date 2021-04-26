import React from 'react';
import User from 'services/user/user.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import 'moment-timezone';
import Tooltip from 'components/Tooltip/Tooltip.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Emojione from 'components/Emojione/Emojione';
import { Message } from 'app/services/Apps/Messages/Message';

type Props = {
  message: Message;
  collectionKey: string;
};

export default (props: Props) => {
  const has_reactions =
    !props.message?.hidden_data?.disable_reactions &&
    props.message?.reactions &&
    props.message?.reactions.length > 0;
  if (!has_reactions) {
    return <span />;
  }
  return (
    <div className="reactions">
      {props.message?.reactions
        .sort(
          (a: string, b: string) =>
            ((props.message?.reactions || {})[b]?.count || 0) -
            ((props.message?.reactions || {})[a]?.count || 0),
        )
        .map((reaction: { name: string; count: number; users: string[] }, index: number) => {
          const value = reaction.count || 0;
          const members: string[] = reaction.users || [];
          if (value <= 0) {
            return '';
          }
          return (
            <Tooltip
              position="top"
              className="reaction_container"
              key={index}
              tooltip={members.map(id => {
                const user = Collections.get('users').find(id);
                if (!user) {
                  return '';
                }
                const name = User.getFullName(user);
                return (
                  <div key={id} style={{ whiteSpace: 'nowrap' }}>
                    {name}
                  </div>
                );
              })}
            >
              <div
                className={
                  'reaction ' + (props.message?._user_reaction == reaction ? 'is_selected ' : '')
                }
                onClick={() => {
                  MessagesService.react(props.message, reaction.name, props.collectionKey);
                }}
              >
                <Emojione type={reaction.name} />
                {reaction.count}
              </div>
            </Tooltip>
          );
        })}
    </div>
  );
};
