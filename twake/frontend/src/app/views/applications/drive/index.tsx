import Browser from './browser';
import { SelectorModal } from './modals/selector';
import TwakeTabConfiguration from './twake-tab-configuration';

export type EmbedContext = {
  companyId?: string;
  workspaceId?: string;
  channelId?: string;
  tabId?: string;
};

export default ({
  initialParentId,
  context,
  inPublicSharing,
}: {
  initialParentId?: string;
  context?: EmbedContext;
  inPublicSharing?: boolean;
}) => {
  return (
    <>
      <SelectorModal />
      <Drive
        initialParentId={initialParentId}
        context={context}
        inPublicSharing={inPublicSharing}
      />
    </>
  );
};

const Drive = ({
  initialParentId,
  context,
  inPublicSharing,
}: {
  initialParentId?: string;
  context?: EmbedContext;
  inPublicSharing?: boolean;
}) => {
  if (context?.tabId) {
    return <TwakeTabConfiguration context={context} />;
  }

  return <Browser initialParentId={initialParentId} inPublicSharing={inPublicSharing} />;
};
