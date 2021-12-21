import React, { useEffect } from 'react';
import Languages from 'services/languages/languages';
import { useEphemeralMessages } from 'app/state/recoil/hooks/messages/useEphemeralMessages';
import useRouterCompany from 'app/state/recoil/hooks/router/useRouterCompany';
import MessageContent from '../../Message/Parts/MessageContent';
import { MessageContext } from '../../Message/MessageWithReplies';
import ThreadSection from '../../Parts/ThreadSection';

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
    workspaceId: props.workspaceId || '',
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
