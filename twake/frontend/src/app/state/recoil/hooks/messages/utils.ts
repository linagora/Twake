import { refinePluginDefs } from '@fullcalendar/core/options';
import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import _ from 'lodash';
import { useAddMessageToChannel, useRemoveMessageFromChannel } from './useChannelMessages';
import { useSetMessage } from './useMessage';
import { useAddMessageToThread, useRemoveMessageFromThread } from './useThreadMessages';

/**
 * This convert a NodeMessage to a MessageWithReply type to make things easier
 */
export const messageToMessageWithReplies = (m: NodeMessage | MessageWithReplies) => {
  const mwr: MessageWithReplies = {
    ...m,
    last_replies: (m as MessageWithReplies)?.last_replies || [],
    stats: (m as MessageWithReplies)?.stats || { last_activity: m.created_at, replies: 0 },
  };
  return mwr;
};
