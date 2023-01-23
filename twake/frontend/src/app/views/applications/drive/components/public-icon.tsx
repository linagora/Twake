import { CloudIcon } from '@heroicons/react/solid';
import Tooltip from 'app/components/tooltip/tooltip';

export const PublicIcon = ({ className }: { className?: string }) => {
  return (
    <Tooltip className={'flex ' + className} position="top" tooltip={'Available from public link'}>
      <CloudIcon className={className} />
    </Tooltip>
  );
};
