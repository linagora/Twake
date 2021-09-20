import React, { useState } from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { Minus, Plus } from 'react-feather';
import './styles.scss';
import PendingFileRow from './PendingFileRow';
import Languages from 'services/languages/languages';
import { PendingFileType } from 'app/models/File';

type PropsType = {
  files: PendingFileType[];
};

const { Text } = Typography;
const { Header, Content } = Layout;
export default ({ files }: PropsType) => {
  const [hidePendingFiles, setHidePendingFiles] = useState<boolean>(false);
  return files.length > 0 ? (
    <Layout className="pending-files-list-layout">
      <Header
        className="pending-files-list-header"
        style={{ borderRadius: !hidePendingFiles ? '8px 8px 0 0' : 8 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'var(--white)' }}>
              {Languages.t('components.drive_dropzone.uploading')}
            </Text>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            {!hidePendingFiles ? (
              <Minus
                size={18}
                onClick={() => setHidePendingFiles(!hidePendingFiles)}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <Plus
                size={18}
                onClick={() => setHidePendingFiles(!hidePendingFiles)}
                style={{ cursor: 'pointer' }}
              />
            )}
          </Col>
        </Row>
      </Header>
      {!hidePendingFiles && (
        <Content className="pending-files-list-content">
          {files.length > 0 &&
            files.map((pendingFile, index) => (
              <PendingFileRow
                key={`${pendingFile.file?.id}-${index}`}
                pendingFile={pendingFile}
                onCancel={() => console.log(pendingFile)}
              />
            ))}
        </Content>
      )}
    </Layout>
  ) : (
    <></>
  );
};
