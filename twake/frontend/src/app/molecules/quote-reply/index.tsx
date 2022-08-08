import React from 'react';
import { X } from 'react-feather';

type PropsType = {
  message: string;
  author: string;
  closable?: boolean;
  onClose?: () => void;
};

export default ({ author, message, closable = true, onClose }: PropsType) => {
  return (
    <div
      className="flex rounded-none mt-4 pl-4 pr-2 pt-2 border-solid border-l-4 bg-indigo-100"
      style={{
        borderColor: 'var(--primary)',
      }}
    >
      <div className="flex-1">
        <h3 className="text-sm text-blue-500">{author}</h3>
        <div className="mb-2 pt-2 text-sm truncate text-ellipsis"> {message} </div>
      </div>
      {closable && (
        <div className="flex-shrink">
          <X size={16} className="cursor-pointer float-right" onClick={onClose} />
        </div>
      )}
    </div>
  );
};
