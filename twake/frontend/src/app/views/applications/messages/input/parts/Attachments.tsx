import { Card, Col, Row, Tooltip, Typography } from 'antd';
import { FileType } from 'app/features/files/types/file';
import '../input.scss';
import React from 'react';

type PropsType = {
  files: FileType[];
};

const { Text } = Typography;
export default ({ files }: PropsType) => {
  return (
    <Row className="attached-files-container" justify="start">
      {files.map(f => (
        <Col key={f.id} className="attached-file">
          <Card size="small">
            <Tooltip placement="top" title={f?.metadata?.name || ''}>
              <Text ellipsis style={{ width: 80, verticalAlign: 'middle' }}>
                {f?.metadata?.name || ''}
              </Text>
            </Tooltip>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
