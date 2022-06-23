import React from 'react';

// @ts-ignore

interface MediaProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size: MediaSize;
  url: string;
  duration?: string;
}

export enum MediaSize {
  LG = 32,
  MD = 16,
  SM = 12,
}

export default function Media(props: MediaProps) {
  const size = props.size.valueOf();

  let timing = undefined;

  if (props.duration) {
    timing = '▶ ' + props.duration;
    switch (props.size) {
      case MediaSize.SM:
        timing = '▶';
        break;
      case MediaSize.MD:
        if (props.duration.length > 6) {
          timing = props.duration;
        }
    }
  }

  const wrpClassName = `relative cursor-inherit w-${size} h-${size}`;
  const imgClassName = `object-cover rounded-md w-${size} h-${size} border border-slate-300`;
  return (
    <div className={wrpClassName}>
      <img src={props.url} className={imgClassName} />
      {timing && (
        <div className={'absolute bottom-1 max-w-full right-1'}>
          <div className="ml-[7px] text-white bg-black/50 rounded-md truncate whitespace-nowrap px-1.5 text-xs">
            {timing}
          </div>
        </div>
      )}
    </div>
  );
}
