import { CloudIcon } from '@heroicons/react/solid';
import { Button } from 'app/atoms/button/button';
import { Title } from 'app/atoms/text';
import { useDriveItem } from 'app/features/drive/hooks/use-drive-item';
import { DriveItem } from 'app/features/drive/types';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { DriveCurrentFolderAtom } from '.';
import { PublicIcon } from './components/public-icon';

export default () => {
  const { documentId } = useParams() as { documentId?: string };
  const [parentId, setParentId] = useRecoil(DriveCurrentFolderAtom(documentId || 'root'));
  const { path: livePath, inTrash } = useDriveItem(parentId);

  const [savedPath, setSavedPath] = useState<DriveItem[]>([]);
  useEffect(() => {
    if (livePath) setSavedPath(livePath);
  }, [livePath]);
  const path = livePath || savedPath;

  return <PathRender inTrash={inTrash || false} path={path} onClick={id => setParentId(id)} />;
};

export const PathRender = ({
  path,
  inTrash,
  onClick,
}: {
  path: DriveItem[];
  inTrash: boolean;
  onClick: (id: string) => void;
}) => {
  return (
    <Title className="overflow-auto whitespace-nowrap mr-2 pl-px">
      <PathItem
        item={inTrash ? { name: 'Trash', id: 'trash' } : { name: 'Home', id: 'root' }}
        first
        last={!path?.length}
        onClick={onClick}
      />
      {(path || [])?.map((a, i) => (
        <PathItem key={a.id} item={a} last={i + 1 === path?.length} onClick={onClick} />
      ))}
    </Title>
  );
};

const PathItem = ({
  item,
  first,
  last,
  onClick,
}: {
  item: Partial<DriveItem>;
  last?: boolean;
  first?: boolean;
  onClick: (id: string) => void;
}) => {
  return (
    <Button
      theme={last ? 'primary' : 'default'}
      className={'-ml-px ' + (!first ? 'rounded-l-none ' : '') + (!last ? 'rounded-r-none ' : '')}
      onClick={() => {
        onClick(item?.id || '');
      }}
    >
      {item?.name || ''}
      {item?.access_info?.public?.level && item?.access_info?.public?.level !== 'none' && (
        <PublicIcon className="h-5 w-5 ml-2" />
      )}
    </Button>
  );
};
function useRecoil(arg0: RecoilState<string>): [any, any] {
  throw new Error('Function not implemented.');
}
