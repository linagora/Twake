import { atomFamily } from 'recoil';
import Browser from './browser';

export const DriveCurrentFolderAtom = atomFamily<string, string>({
  key: 'DriveCurrentFolderAtom',
  default: startingParentId => startingParentId || 'root',
});

type EmbedContext = {
  companyId: string;
  workspaceId: string;
  channelId: string;
  tabId: string;
};

export default ({
  initialParentId,
  context,
}: {
  initialParentId?: string;
  context?: EmbedContext;
}) => {
  //TODO use 'context' to show tab configuration page

  return <Browser initialParentId={initialParentId} />;
};
