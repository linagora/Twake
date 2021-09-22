import React from 'react';
import { Row, Col, Typography, Divider, Progress, Button, Tooltip } from 'antd';
import { Pause, Play, X } from 'react-feather';
import { PendingFileStateType, PendingFileType } from 'app/models/File';
import ChatUploadServiceManager from '../ChatUploads/ChatUploadService';
import {
  isPendingFileStatusError,
  isPendingFileStatusPause,
} from '../ChatUploads/utils/PendingFiles';
import Languages from 'services/languages/languages';

type PropsType = {
  pendingFileState: PendingFileStateType;
  pendingFile: PendingFileType;
};

const { Text } = Typography;
export default ({ pendingFileState, pendingFile }: PropsType) => {
  const chatUploadService = ChatUploadServiceManager.get();

  const getProgressStrokeColor = (status: PendingFileStateType['status']) => {
    if (isPendingFileStatusError(status)) return 'var(--error)';
    if (isPendingFileStatusPause(status)) return 'var(--warning)';

    return 'var(--success)';
  };

  const pauseOrResume = (id: PendingFileStateType['id']) => chatUploadService.pauseOrResume(id);

  const cancel = (id: PendingFileStateType['id']) => chatUploadService.cancel(id);

  return (
    <>
      <Row
        justify="space-around"
        align="middle"
        wrap={false}
        style={{
          padding: '4px 4px',
          width: '100%',
        }}
      >
        <Col className="small-left-margin" flex="auto" style={{ lineHeight: '16px' }}>
          {pendingFile.tmpFile.name ? (
            <Text ellipsis style={{ maxWidth: 160, verticalAlign: 'middle' }}>
              {pendingFile.tmpFile.name}
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
            percent={pendingFileState.progress * 100}
            showInfo={false}
            status={
              isPendingFileStatusPause(pendingFileState.status) ||
              isPendingFileStatusError(pendingFileState.status)
                ? 'exception'
                : 'active'
            }
            strokeColor={getProgressStrokeColor(pendingFileState.status)}
          />
        </Col>

        <Col flex={1} style={{ display: 'flex', alignItems: 'center', lineHeight: '16px' }}>
          {pendingFileState.id ? (
            <Tooltip
              placement="top"
              title={
                isPendingFileStatusPause(pendingFileState.status)
                  ? Languages.t('general.resume')
                  : Languages.t('general.pause')
              }
            >
              <Button
                type="link"
                shape="circle"
                disabled={isPendingFileStatusError(pendingFileState.status)}
                icon={
                  isPendingFileStatusPause(pendingFileState.status) ? (
                    <Play size={14} style={{ marginLeft: 4 }} />
                  ) : (
                    <Pause size={14} />
                  )
                }
                onClick={() => pauseOrResume(pendingFileState.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          ) : (
            <div
              style={{
                marginTop: 8,
                height: 8,
                maxWidth: 32,
                borderRadius: 8,
                backgroundColor: 'var(--grey-background)',
              }}
            />
          )}
        </Col>

        <Col flex={1} style={{ display: 'flex', alignItems: 'center', lineHeight: '16px' }}>
          <Tooltip title={Languages.t('general.cancel')} placement="top">
            <Button
              type="link"
              shape="circle"
              icon={<X size={16} color={'var(--error)'} />}
              onClick={() => cancel(pendingFileState.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </Tooltip>
        </Col>
      </Row>
      <Divider style={{ margin: 0 }} />
    </>
  );
};
