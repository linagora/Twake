import FileUploadAPIClient from '@features/files/api/file-upload-api-client';
import { MessageFileType } from '@features/messages/types/message';
import Media from '@molecules/media';
import { onFilePreviewClick } from '../common';

export default (props: { file: MessageFileType }) => {
  const file = props.file;
  const url = FileUploadAPIClient.getFileThumbnailUrlFromMessageFile(file);
  const type = FileUploadAPIClient.mimeToType(file?.metadata?.mime || '');

  return (
    <div
      className="cursor-pointer hover:opacity-75 inline-block m-2"
      onClick={() => onFilePreviewClick(file)}
    >
      <Media
        key={file.id}
        size="lg"
        url={url}
        duration={
          type === 'video'
            ? file?.metadata?.name?.split('.').slice(-1)?.[0]?.toLocaleUpperCase()
            : undefined
        }
      />
    </div>
  );
};
