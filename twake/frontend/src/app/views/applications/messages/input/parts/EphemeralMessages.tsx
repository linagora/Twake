import Languages from 'app/features/global/services/languages-service';
import { useEphemeralMessages } from 'app/features/messages/hooks/use-ephemeral-messages';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useEffect } from 'react';
import { MessageContext } from '../../message/message-with-replies';
import MessageContent from '../../message/parts/MessageContent';
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
  const workspaceId = props.workspaceId;
  const channelId = props.channelId;
  const { lastEphemeral } = useEphemeralMessages({
    companyId,
    channelId: props.channelId,
  });

  const messageKey = {
    id: lastEphemeral?.id || '',
    threadId: lastEphemeral?.thread_id || '',
    companyId,
  };

  const hasEphemeral =
    lastEphemeral &&
    (lastEphemeral.thread_id === props.threadId ||
      (!props.threadId &&
        (!lastEphemeral.thread_id || lastEphemeral.thread_id === lastEphemeral.id)));

  useEffect(() => {
    if (lastEphemeral && hasEphemeral) {
      props.onHasEphemeralMessage();
    } else {
      props.onNotEphemeralMessage();
    }
  }, [lastEphemeral, hasEphemeral]);

  if (!hasEphemeral) {
    return <div />;
  }

  const updatedKey =
    lastEphemeral.id + lastEphemeral.ephemeral?.version + lastEphemeral.ephemeral?.id;

  return (
    <div className="ephemerals" key={updatedKey}>
      <div className="ephemerals_text">
        {Languages.t('scenes.apps.messages.just_you', [], 'Visible uniquement par vous')}
      </div>

      <MessageContext.Provider value={{ ...messageKey, companyId, workspaceId, channelId }}>
        <ThreadSection withAvatar head>
          <MessageContent key={updatedKey} />
        </ThreadSection>
      </MessageContext.Provider>
    </div>
  );
};
