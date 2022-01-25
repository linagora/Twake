import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageViewAPIClient from 'app/services/Apps/Messages/clients/MessageViewAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import _ from 'lodash';
import { useState } from 'react';
import { atomFamily, useRecoilCallback, useRecoilState } from 'recoil';
import { AtomChannelKey } from '../../atoms/Messages';
import { useSetMessage } from './useMessage';

const EphemeralMessageState = atomFamily<NodeMessage | null, AtomChannelKey>({
  key: 'EphemeralMessageState',
  default: key => null,
});

export const useEphemeralMessages = (key: AtomChannelKey) => {
  const [lastEphemeral, setLastEphemeral] = useRecoilState(EphemeralMessageState(key));
  const getLastEphemeral = useRecoilCallback(({ snapshot }) => (key: AtomChannelKey) => {
    return snapshot.getLoadable(EphemeralMessageState(key)).valueMaybe();
  });
  const setMessage = useSetMessage(key.companyId);

  useRealtimeRoom<MessageWithReplies>(
    MessageViewAPIClient.feedWebsockets(key.channelId)[0],
    'useEphemeralMessages',
    async (action: string, event: any) => {
      if (action === 'created' || action === 'updated') {
        const message = event as NodeMessage;
        const lastEphemeral = getLastEphemeral(key);
        if (message.ephemeral) {
          if (
            message.subtype === 'deleted' &&
            (message.id === lastEphemeral?.id ||
              (message.ephemeral.id && message.ephemeral.id === lastEphemeral?.ephemeral?.id) ||
              message.ephemeral.recipient === CurrentUser.get().id)
          ) {
            setLastEphemeral(null);
          } else if (
            message.ephemeral.recipient === CurrentUser.get().id &&
            (!message.ephemeral.recipient_context_id ||
              message.ephemeral.recipient_context_id === CurrentUser.unique_connection_id)
          ) {
            setMessage(message);
            setLastEphemeral(message);
          }
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
