import { useChannelMediaList } from 'app/features/channels/hooks/use-channel-media-files';
import fileUploadApiClient from 'app/features/files/api/file-upload-api-client';
import React from 'react';
import ChannelAttachment from './channel-attachment';
import { LoadingAttachements, NoAttachements } from './commun';

type PropsType = {
  maxItems?: number;
};

export default ({ maxItems }: PropsType): React.ReactElement => {
  const { loading, result } = useChannelMediaList();

  if (loading) return <LoadingAttachements />;

  if (result.length === 0 && !loading) return <NoAttachements />;

  return (
    <>
      {result
        .slice(0, maxItems || result.length)
        .map(file => {
          const url = fileUploadApiClient.getFileThumbnailUrlFromMessageFile(file);

          return url && <ChannelAttachment key={file.id} file={file} is_media={true} />;
        })
        .filter(Boolean)}
    </>
  );
};
