import React from 'react';
import * as Text from '@atoms/text';

// @ts-ignore
interface BlockProps extends React.InputHTMLAttributes<HTMLInputElement> {
  avatar: JSX.Element;
  title: JSX.Element | string;
  subtitle: JSX.Element | string;
  title_suffix?: JSX.Element | string;
  subtitle_suffix?: JSX.Element | string;
  suffix?: JSX.Element | string;
  className?: string;
}

export default function Block(props: BlockProps) {
  const className = props.className || '';

  return (
    <div className={'flex ' + className}>
      <div className=" flex items-center">{props.avatar}</div>

      <div className="flex grow flex-col justify-center ml-2 min-w-0 grow">
        <div className="flex">
          <div className="grow truncate leading-tight mr-1">
            <Text.Title className="inline">{props.title}</Text.Title>
          </div>
          <div className="text-sm text-gray-300 leading-tight whitespace-nowrap">
            {props.title_suffix}
          </div>
        </div>
        <div className="flex">
          <div className="grow truncate leading-normal text-slate-500 mr-1">
            <Text.Base className="text-slate-500 dark:text-slate-400">{props.subtitle}</Text.Base>
          </div>
          <div className="whitespace-nowrap">{props.subtitle_suffix}</div>
        </div>
      </div>
      {props.suffix && (
        <div className="flex flex-col justify-center ml-1">
          <div className="flex">{props.suffix}</div>
        </div>
      )}
    </div>
  );
}
