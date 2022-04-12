import React, { useEffect } from 'react';
import Languages from 'app/features/global/services/languages-service';
import { useEphemeralMessages } from 'app/features/messages/hooks/use-ephemeral-messages';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import MessageContent from '../../message/parts/MessageContent';
import { MessageContext } from '../../message/message-with-replies';
import ThreadSection from '../../parts/thread-section';

type Props = {
  channelId: string;
  workspaceId: string;
  threadId: string;
  onHasEphemeralMessage: () => void;
  onNotEphemeralMessage: () => void;
};

export default (props: Props) => {
  const companyId = useRouterCompany();
  const { lastEphemeral, remove } = useEphemeralMessages({
    companyId,
    channelId: props.channelId,
  });

  const messageKey = {
    id: lastEphemeral?.id || '',
    threadId: lastEphemeral?.thread_id || '',
    companyId,
  };

  useEffect(() => {
    if (lastEphemeral) {
      props.onHasEphemeralMessage();
    } else {
      props.onNotEphemeralMessage();
    }
  }, [lastEphemeral]);

  if (!lastEphemeral) {
    return <div />;
  }

  console.log(lastEphemeral);

  return (
    <div className="ephemerals" key={lastEphemeral.ephemeral?.id}>
      <div className="ephemerals_text">
        {Languages.t('scenes.apps.messages.just_you', [], 'Visible uniquement par vous')}
      </div>

      <MessageContext.Provider value={messageKey}>
        <ThreadSection withAvatar head>
          <MessageContent key={lastEphemeral.ephemeral?.id} />
        </ThreadSection>
      </MessageContext.Provider>
    </div>
  );
};
