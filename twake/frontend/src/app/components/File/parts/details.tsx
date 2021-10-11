import React from 'react';
import { Typography } from 'antd';
import { capitalize } from 'lodash';
import Numbers from 'app/services/utils/Numbers';
import { DataFileType } from '../types';

type PropsType = {
  data: DataFileType;
};

const setRealFileSize = ({ data }: PropsType): string =>
  Numbers.humanFileSize(data.file.size, true);

const setFileType = ({ data }: PropsType): string => capitalize(data.file.type.split('/')[0]);

const { Text } = Typography;
export const FileDetails = ({ data }: PropsType): JSX.Element => (
  <div className="file-component-details">
    <Text ellipsis style={{ verticalAlign: 'middle' }}>
      {data.file.name}
    </Text>
    <Text type="secondary" ellipsis style={{ verticalAlign: 'middle' }}>
      {setRealFileSize({ data })} {setFileType({ data })}
    </Text>
  </div>
);

export default FileDetails;
