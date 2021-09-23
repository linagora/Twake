import React, { useState } from 'react';
import { Layout, Row, Col, Typography } from 'antd';
import { Minus, Plus } from 'react-feather';
import './styles.scss';
import PendingFileRow from './PendingFileRow';
import Languages from 'services/languages/languages';
import { PendingFileStateType } from 'app/models/File';
import ChatUploadService from '../ChatUploadService';

type PropsType = {
  pendingFilesState: PendingFileStateType[];
};

const { Text } = Typography;
const { Header, Content } = Layout;
export default ({ pendingFilesState }: PropsType) => {
  const [hiddenPendingFiles, setHiddenPendingFiles] = useState<boolean>(false);

  const uploadTaskTotalFiles = pendingFilesState.length;
  const uploadTaskUploadedFiles = pendingFilesState.filter(f => f.status === 'success').length;

  return pendingFilesState.length > 0 ? (
    <Layout className="pending-files-list-layout">
      <Header
        className="pending-files-list-header"
        style={{ borderRadius: hiddenPendingFiles ? 8 : '8px 8px 0 0', cursor: 'pointer' }}
        onClick={() => setHiddenPendingFiles(!hiddenPendingFiles)}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'var(--white)' }}>
              {uploadTaskTotalFiles > 0 && `${uploadTaskUploadedFiles}/${uploadTaskTotalFiles} `}
              {Languages.t('components.drive_dropzone.uploading')}
            </Text>
          </Col>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            {hiddenPendingFiles ? <Plus size={18} /> : <Minus size={18} />}
          </Col>
        </Row>
      </Header>
      {!hiddenPendingFiles && (
        <Content className="pending-files-list-content">
          {pendingFilesState.length > 0 &&
            pendingFilesState.map((pendingFileState, index) => (
              <PendingFileRow
                key={`${pendingFileState.file?.id}-${index}`}
                pendingFileState={pendingFileState}
                pendingFile={ChatUploadService.getPendingFile(pendingFileState.id)}
              />
            ))}
        </Content>
      )}
    </Layout>
  ) : (
    <></>
  );
};
