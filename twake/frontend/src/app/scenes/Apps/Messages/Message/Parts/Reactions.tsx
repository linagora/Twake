import React from 'react';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import Tooltip from 'components/Tooltip/Tooltip.js';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Emojione from 'components/Emojione/Emojione';

type Props = {
  message: Message;
  collectionKey: string;
};

export default (props: Props) => {
  const has_reactions =
    !props.message?.hidden_data?.disable_reactions &&
    props.message?.reactions &&
    Object.keys(props.message?.reactions).length > 0;
  if (!has_reactions) {
    return <span />;
  }
  return (
    <div className="reactions">
      {Object.keys(props.message?.reactions || {})
        .sort(
          (a: string, b: string) =>
            ((props.message?.reactions || {})[b]?.count || 0) -
            ((props.message?.reactions || {})[a]?.count || 0),
        )
        .map(reaction => {
          var value = (props.message?.reactions || {})[reaction]?.count || 0;
          var members = Object.values(props.message?.reactions[reaction]?.users || []);
          if (value <= 0) {
            return '';
          }
          return (
            <Tooltip
              position="top"
              className="reaction_container"
              tooltip={members.map(id => {
                var user = Collections.get('users').find(id);
                if (!user) {
                  return '';
                }
                var name = User.getFullName(user);
                return <div style={{ whiteSpace: 'nowrap' }}>{name}</div>;
              })}
            >
              <div
                className={
                  'reaction ' + (props.message?._user_reaction == reaction ? 'is_selected ' : '')
                }
                onClick={() => {
                  MessagesService.react(props.message, reaction, props.collectionKey);
                }}
              >
                <Emojione type={reaction} />
                {parseInt(value)}
              </div>
            </Tooltip>
          );
        })}
    </div>
  );
};
