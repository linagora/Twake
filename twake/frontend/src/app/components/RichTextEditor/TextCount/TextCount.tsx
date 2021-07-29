// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Typography } from 'antd';
import { EditorState } from 'draft-js';
import TextCountService from './TextCountService';

type PropsType = {
  editorState: EditorState;
};

export const TextCount = ({ editorState }: PropsType) => {
  const { Text } = Typography;

  return (
    <Text type="secondary">
      <Text type={TextCountService.textIsTooLong(editorState) ? 'danger' : 'secondary'}>
        {TextCountService.getCurrentTextLength(editorState)}
      </Text>
      /{TextCountService.MAX_TEXT_LENGTH}
    </Text>
  );
};
