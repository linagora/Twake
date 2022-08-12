import {
  useFileViewer,
  useFileViewerModal,
  useViewerDisplayData,
} from 'app/features/viewer/hooks/use-viewer';
import ImageDisplay from './images/display';
import VideoDisplay from './videos/display';

export default () => {
  const { download, type } = useViewerDisplayData();
  const { isOpen } = useFileViewerModal();

  if (!download || !isOpen) {
    return <></>;
  }

  if (type === 'image') {
    return <ImageDisplay download={download} />;
  }

  if (type === 'video') {
    return <VideoDisplay download={download} />;
  }

  return (
    <div className="text-white m-auto w-full text-center block h-full flex items-center">
      <span className="block w-full text-center">We can't display this document.</span>
    </div>
  );
};
