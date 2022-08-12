import { useEffect, useState } from 'react';
import { useEditors } from './editors-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';

export default (props: { download: string; name: string }) => {
  const extension = props.name.split('.').pop();
  const { candidates, openFile, getPreviewUrl } = useEditors(extension || '');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    (async () => {
      if (!previewUrl) setPreviewUrl((await getPreviewUrl()) || '');
    })();
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
