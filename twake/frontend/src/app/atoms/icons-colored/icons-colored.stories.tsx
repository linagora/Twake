import React, { cloneElement, ComponentProps } from 'react';
import { ComponentStory } from '@storybook/react';
import {
  DismissIcon,
  FileTypeArchiveIcon,
  FileTypeDocumentIcon,
  FileTypePdfIcon,
  FileTypeSpreadsheetIcon,
  FileTypeUnknownIcon,
  NotFoundIcon,
} from '@atoms/icons-colored/index';

export default {
  title: '@atoms/icons-colored',
};

type PropsType = {
  icon: JSX.Element;
  title: string;
};

const Icon = ({ icon, title }: PropsType): JSX.Element => {
  const comp = cloneElement(icon, { className: 'w-8 h-8' });

  return (
    <div className="flex flex-col place-items-center w-[90px] my-3">
      {comp}
      <div className="m-2 text-xs text-zinc-500 break-words max-w-[68px] text-center">{title}</div>
    </div>
  );
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<any> = (props: ComponentProps<'svg'>) => {
  return (
    <>
      <h1>General</h1>
      <div className="flex flex-wrap mb-2">
        <Icon icon={<DismissIcon />} title="Dismiss" />
      </div>
      <h1>FileTypes</h1>
      <div className="flex flex-wrap mb-2">
        <Icon icon={<FileTypeArchiveIcon />} title="FileTypeArchive" />
        <Icon icon={<FileTypePdfIcon />} title="FileTypePdf" />
        <Icon icon={<FileTypeDocumentIcon />} title="FileTypeDocument" />
        <Icon icon={<FileTypeSpreadsheetIcon />} title="FileTypeSpreadsheet" />
        <Icon icon={<FileTypeUnknownIcon />} title="FileTypeUnknown" />
      </div>
      <h1>Component specific</h1>
      <div className="flex flex-wrap mb-2">
        <Icon icon={<NotFoundIcon />} title="NotFound" />
      </div>
    </>
  );
};

export const Default = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Default.args = {};
