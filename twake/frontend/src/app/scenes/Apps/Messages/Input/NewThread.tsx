import React, { useState } from 'react';
import Thread from '../Parts/Thread';
import ThreadSection from '../Parts/ThreadSection';
import { PlusCircle } from 'react-feather';
import Input from './Input';
import './Input.scss';

type Props = {
  useButton?: boolean;
  collectionKey: string;
};

export default (props: Props) => {
  const [input, setInput] = useState(!props.useButton);

  if (!input) {
    return (
      <Thread withBlock className="new-thread-button" onClick={() => setInput(true)}>
        <ThreadSection noSenderSpace>
          <PlusCircle size={16} className="plus-icon" /> Start a new discussion
        </ThreadSection>
      </Thread>
    );
  } else {
    return (
      <Thread withBlock className="new-thread">
        <ThreadSection noSenderSpace>
          <Input />
        </ThreadSection>
      </Thread>
    );
  }
};
