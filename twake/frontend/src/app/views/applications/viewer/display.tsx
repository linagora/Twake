import { useFileViewer, useViewerDisplayData } from 'app/features/viewer/hooks/use-viewer';
import ImageDisplay from './images/display';
import VideoDisplay from './videos/display';

export default () => {
  const { download, type } = useViewerDisplayData();

  if (!download) {
    return <></>;
  }

  if (type === 'image') {
    return <ImageDisplay download={download} />;
  }

  if (type === 'video') {
    return <VideoDisplay download={download} />;
  }

  return (
    <div className="text-white m-auto text-center block h-full flex items-center">
      <span className="block">We can't display this document.</span>
    </div>
  );
};
