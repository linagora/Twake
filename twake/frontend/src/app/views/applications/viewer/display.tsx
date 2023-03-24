import {
  useFileViewerModal,
  useViewerDisplayData,
} from 'app/features/viewer/hooks/use-viewer';
import ImageDisplay from './images/display';
import VideoDisplay from './videos/display';
import PdfDisplay from './pdf/display';
import CodeDisplay from './code/display';
import ArchiveDisplay from './archive/display';

export default () => {
  const { download, type, name } = useViewerDisplayData();
  const { isOpen } = useFileViewerModal();

  if (!download || !isOpen) {
    return <></>;
  }

  if (type === 'image') {
    return <ImageDisplay download={download} />;
  }

  if (type === 'video' || type === 'audio') {
    return <VideoDisplay download={download} />;
  }

  if (type === 'pdf') {
    return <PdfDisplay download={download} name={name} />;
  }

  if (type === 'code') {
    return <CodeDisplay download={download} name={name} />;
  }

  if (type === 'archive') {
    return <ArchiveDisplay download={download} name={name} />;
  }

  /* Uncomment after https://github.com/linagora/Twake/issues/2453 is done
  if (type) {
    return <OtherDisplay download={download} name={name} />;
  }*/

  return (
    <div className="text-white m-auto w-full text-center block h-full flex items-center">
      <span className="block w-full text-center">We can't display this document.</span>
    </div>
  );
};
