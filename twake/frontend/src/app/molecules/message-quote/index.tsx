import React from 'react';
import { Info } from 'app/atoms/text';
import Languages from 'app/features/global/services/languages-service';
import { X } from 'react-feather';

type PropsType = {
  message: JSX.Element;
  author: string;
  closable?: boolean;
  deleted?: boolean;
  goToMessage?: () => void;
  onClose?: () => void;
};

export default ({
  author,
  message,
  closable = true,
  onClose,
  deleted = false,
  goToMessage,
}: PropsType) => {
  return (
    <div
      className="flex flex-row rounded-none mt-4 pl-4 pr-2 py-2 mb-2 border-solid border-l-4 bg-indigo-100 cursor-pointer"
      style={{
        borderColor: 'var(--primary)',
      }}
      onClick={goToMessage}
    >
      <div className="grow w-full max-w-full">
        <h3 className="text-sm text-blue-500">{author}</h3>
        <div className="mb-2 pt-2 text-sm truncate text-ellipsis">
          {deleted ? (
            <Info className="italic">{Languages.t('molecules.message_quote.deleted')}</Info>
          ) : (
            message
          )}
        </div>
      </div>
      {closable && onClose && (
        <div className="flex-none w-2">
          <X
            size={16}
            className="cursor-pointer float-right"
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
          />
        </div>
      )}
    </div>
  );
};
