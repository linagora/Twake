import React, { FC, useState } from 'react';
import Languages from 'services/languages/languages.js';
import ObjectModal from 'components/ObjectModal/ObjectModal';

import { Button, Input } from 'antd';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
};

const ChannelMembersList: FC<Props> = props => {
  return (
    <ObjectModal
      title="This is the title"
      closable={true}
      footer={<Button type="primary">Add</Button>}
    >
      <Input />
    </ObjectModal>
  );
};

export default ChannelMembersList;
