import { useEditors } from './editors-service';

export default (props: { download: string; name: string }) => {
  const extension = props.name.split('.').pop();
  const { candidates, openFile, getPreviewUrl } = useEditors(extension || '');

  //TODO
  const previewOnly = true;

  return (
    <>
      <iframe
        className="w-full h-full left-0 right-0 absolute bottom-0 top-0"
        title={props.name}
        src={getPreviewUrl()}
      />
    </>
  );
};
