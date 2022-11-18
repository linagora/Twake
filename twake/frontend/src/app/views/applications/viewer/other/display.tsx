import { useEffect, useState } from 'react';
import { useEditors } from './editors-service';

export default (props: { download: string; name: string; id: string }) => {
  const extension = props.name.split('.').pop();
  const { getPreviewUrl } = useEditors(extension || '');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
      if (!previewUrl) setPreviewUrl(getPreviewUrl(props.id)|| '');
  }, [previewUrl, setPreviewUrl]);

  return (
    <>
      <iframe
        className="w-full h-full left-0 right-0 absolute bottom-0 top-0"
        title={props.name}
        src={previewUrl}
      />
    </>
  );
};
