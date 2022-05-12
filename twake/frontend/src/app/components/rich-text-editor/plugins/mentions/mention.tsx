import User from 'app/components/twacode/blocks/user';
import React from 'react';

export const Mention = (props: any): JSX.Element => {
  return <span className="label suggestion mention">{props.children}</span>;
};
