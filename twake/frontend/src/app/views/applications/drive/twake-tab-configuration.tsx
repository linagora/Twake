import { useDriveTwakeTab } from 'app/features/drive-twake/hooks/use-drive-twake-tab';
import { EmbedContext } from '.';

export default ({ context }: { context?: EmbedContext }) => {
  const { tab, setTab } = useDriveTwakeTab(context?.tabId || '');
  //TODO load tab configuration from drive backend
  // If nothing is configured, then show the selector and when selected the folder will give access to the whole channel
  // If configured then show the content of the tab and forward the fact that the access is done through a specific channel

  return <div>TODO: show tab configuration page</div>;
};
