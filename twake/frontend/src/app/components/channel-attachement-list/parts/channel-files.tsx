import { useChannelFileList } from 'app/features/channels/hooks/use-channel-media-files';
import React from 'react';
import ChannelAttachment from './channel-attachment';
import { LoadingAttachements, NoAttachements } from './commun';

type PropsType = {
  maxItems?: number;
};

export default ({ maxItems }: PropsType): React.ReactElement => {
  const { loading, result } = useChannelFileList();

  if (loading) return <LoadingAttachements />;

  if (result.length === 0 && !loading) return <NoAttachements />

  return (
    <>
      {result.slice(0, maxItems || result.length).map(file => (
        <ChannelAttachment key={file.id} file={file} is_media={false} />
      ))}
    </>
  );
};
