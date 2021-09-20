import React from 'react';
import { Row, Col, Typography, Divider, Progress } from 'antd';
import { X } from 'react-feather';
import Globals from 'services/Globals';
import { PendingFileType } from 'app/models/File';

type PropsType = {
  pendingFile: PendingFileType;
  onCancel: React.DOMAttributes<SVGElement>['onClick'];
};

const { Text } = Typography;
export default ({ pendingFile, onCancel }: PropsType) => (
  <>
    <Row
      justify="space-around"
      align="middle"
      wrap={false}
      style={{ padding: '4px 4px', width: '100%' }}
    >
      <Col style={{ lineHeight: '16px', height: 32, width: 32 }}>
        {pendingFile.file?.thumbnails && pendingFile.file.thumbnails.length > 0 ? (
          <img
            style={{ lineHeight: '16px', height: 32, width: 32, borderRadius: 8 }}
            src={`${Globals.api_root_url}/internal/services/files/v1/companies/${pendingFile.file.company_id}/files/${pendingFile.file.id}/thumbnails/0`}
            alt="Thumbnail of the pending uploaded file"
          />
        ) : (
          <div
            style={{
              height: 32,
              width: 32,
              borderRadius: 8,
              backgroundColor: 'var(--grey-background)',
            }}
          />
        )}
      </Col>
      <Col className="small-left-margin" flex="auto" style={{ lineHeight: '16px' }}>
        {pendingFile.file?.metadata?.name ? (
          <Text ellipsis style={{ maxWidth: 160, verticalAlign: 'middle' }}>
            {pendingFile.file.metadata.name}
          </Text>
        ) : (
          <div
            style={{
              marginTop: 8,
              height: 8,
              maxWidth: 160,
              borderRadius: 8,
              backgroundColor: 'var(--grey-background)',
            }}
          />
        )}
        <Progress
          type="line"
          percent={pendingFile.progress}
          showInfo={false}
          style={{ maxWidth: 160 }}
          strokeColor="var(--success)"
        />
      </Col>

      <Col style={{ display: 'flex', alignItems: 'center', lineHeight: '16px' }}>
        {pendingFile.file?.metadata?.name ? (
          <X size={16} onClick={() => console.log(pendingFile)} style={{ cursor: 'pointer' }} />
        ) : (
          <></>
        )}
      </Col>
    </Row>
    <Divider style={{ margin: 0 }} />
  </>
);
