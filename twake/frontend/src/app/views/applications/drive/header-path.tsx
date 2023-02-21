import { Button } from 'app/atoms/button/button';
import { Title } from 'app/atoms/text';
import { DriveItem } from 'app/features/drive/types';
import { useEffect, useState } from 'react';
import { PublicIcon } from './components/public-icon';

export default ({
  path: livePath,
  inTrash,
  setParentId,
}: {
  path: DriveItem[];
  inTrash?: boolean;
  setParentId: (id: string) => void;
}) => {
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
    <Title className="overflow-hidden mr-2 pl-px">
      {(path || [])?.map((a, i) => (
        <PathItem
          key={a.id}
          item={a}
          first={i === 0}
          last={i + 1 === path?.length}
          onClick={onClick}
        />
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
