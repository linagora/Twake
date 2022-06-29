import React from 'react';
import * as Text from '@atoms/text';
import BaseBlock from '@molecules/grouped-rows/base';

// @ts-ignore
interface BlockProps extends React.InputHTMLAttributes<HTMLInputElement> {
  avatar: JSX.Element;
  title: JSX.Element | string;
  subtitle: JSX.Element | string;
  suffix?: JSX.Element | string;
  className?: string;
}

export default function Workspace(props: BlockProps) {
  return BaseBlock(props);
}
