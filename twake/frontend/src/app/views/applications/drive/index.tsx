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
}: {
  initialParentId?: string;
  context?: EmbedContext;
}) => {
  return (
    <>
      <SelectorModal />
      <Drive initialParentId={initialParentId} context={context} />
    </>
  );
};

const Drive = ({
  initialParentId,
  context,
}: {
  initialParentId?: string;
  context?: EmbedContext;
}) => {
  if (context?.tabId) {
    return <TwakeTabConfiguration context={context} />;
  }

  return <Browser initialParentId={initialParentId} />;
};
