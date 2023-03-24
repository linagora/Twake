import { useViewerDisplayData } from 'app/features/viewer/hooks/use-viewer';
import ImageControls from './images/controls';
import VideoControls from './videos/controls';
import PdfControls from './pdf/controls';
import ArchiveControls from './archive/controls';
import CodeControls from './code/controls';

export default () => {
  const { type } = useViewerDisplayData();

  if (!type) {
    return <></>;
  }

  if (type === 'image') {
    return <ImageControls />;
  }

  if (type === 'video' || type === 'audio') {
    return <VideoControls />;
  }

  if (type === 'pdf') {
    return <PdfControls />;
  }

  if (type === 'code') {
    return <CodeControls />;
  }

  if (type === 'archive') {
    return <ArchiveControls />;
  }

  /* Uncomment after https://github.com/linagora/Twake/issues/2453 is done
  if (type) {
    return <OtherControls name={name} />;
  }*/

  return <></>;
};
