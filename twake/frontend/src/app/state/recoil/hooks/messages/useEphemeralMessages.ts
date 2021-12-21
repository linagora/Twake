import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import CurrentUser from 'app/services/user/CurrentUser';
import _ from 'lodash';
import { useState } from 'react';
import { AtomChannelKey } from '../../atoms/Messages';
import { useSetMessage } from './useMessage';

export const useEphemeralMessages = (key: AtomChannelKey) => {
  const [lastEphemeral, setLastEphemeral] = useState<NodeMessage | null>(null);
  const setMessage = useSetMessage(key.companyId);

  useRealtimeRoom<MessageWithReplies>(
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useEphemeralMessages',
    async (action: string, event: any) => {
      if (action === 'created' || action === 'updated') {
        const message = event as NodeMessage;
        if (
          message.ephemeral &&
          message.ephemeral.recipient === CurrentUser.get().id &&
          message.ephemeral.recipient_context_id === CurrentUser.unique_connection_id
        ) {
          setMessage(message);
          setLastEphemeral(message);
          return;
        }
      }
    },
  );

  return {
    lastEphemeral,
    remove: () => setLastEphemeral(null),
  };
};
