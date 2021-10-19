import React from 'react';
import { Typography } from 'antd';
import { capitalize } from 'lodash';

import Numbers from 'app/services/utils/Numbers';
import { DataFileType } from '../types';

type PropsType = {
  file: DataFileType;
};

const setRealFileSize = ({ file }: PropsType): string => Numbers.humanFileSize(file.size, true);

const setFileType = ({ file }: PropsType): string => capitalize(file.type.split('/')[0]);

const { Text } = Typography;
export const FileDetails = ({ file }: PropsType): JSX.Element => (
  <div className="file-component-details">
    <Text ellipsis style={{ verticalAlign: 'middle' }}>
      {file.name}
    </Text>
    <Text type="secondary" ellipsis style={{ verticalAlign: 'middle' }}>
      {setRealFileSize({ file })} {setFileType({ file })}
    </Text>
  </div>
);

export default FileDetails;
