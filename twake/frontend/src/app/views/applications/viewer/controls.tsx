import { useViewerDisplayData } from 'app/features/viewer/hooks/use-viewer';
import ImageControls from './images/controls';
import VideoControls from './videos/controls';

export default () => {
  const { type } = useViewerDisplayData();

  if (!type) {
    return <></>;
  }

  if (type === 'image') {
    return <ImageControls />;
  }

  if (type === 'video') {
    return <VideoControls />;
  }

  return <></>;
};
