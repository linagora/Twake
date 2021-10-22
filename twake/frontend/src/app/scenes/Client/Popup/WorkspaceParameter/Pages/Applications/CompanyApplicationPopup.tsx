import React from 'react';

import moment from 'moment';
import { Avatar, Button, Row, Typography, Image, Col, Tag } from 'antd';

import { Application } from 'app/models/App';
//import Languages from 'services/languages/languages';
import ObjectModal from 'app/components/ObjectModal/ObjectModal';
import ModalManager from 'app/components/Modal/ModalManager';
import { useCurrentCompanyApplications } from 'app/state/recoil/hooks/useCurrentCompanyApplications';
import { Check } from 'react-feather';
type PropsType = {
  application: Application;
  companyId: string;
};

const { Text, Link, Title } = Typography;
export default ({ application, companyId }: PropsType) => {
  const {
    addOneCompanyApplication,
    isLoadingCompanyApplications,
    isApplicationInstalledInCompany,
    deleteOneCompanyApplication,
  } = useCurrentCompanyApplications(companyId);

  const onClickButton = async () => {
    if (isApplicationInstalledInCompany(application.id)) {
      await deleteOneCompanyApplication(application.id);
    } else {
      await addOneCompanyApplication(application.id);
    }

    ModalManager.close();
  };

  const createdDate = moment(application.stats.createdAt);

  return (
    <ObjectModal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <Avatar
            shape="square"
            src={
              <Image
                src={application.identity.icon}
                style={{ width: 24, borderRadius: 4 }}
                preview={false}
              />
            }
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />

          <Title level={3} style={{ margin: '0 8px' }}>
            {application.identity.name}
          </Title>

          {isApplicationInstalledInCompany(application.id) && (
            <Tag
              color="var(--success)"
              style={{
                opacity: '0.5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* // TODO translation here */}
              <Check size={16} /> Installed
            </Tag>
          )}
        </div>
      }
      titleLevel={3}
      closable
      footer={
        <Button
          className="small"
          block={true}
          type="ghost"
          loading={isLoadingCompanyApplications}
          onClick={onClickButton}
          style={{
            background: isApplicationInstalledInCompany(application.id)
              ? 'var(--error)'
              : 'var(--success)',
            color: 'var(--white)',
            width: 'auto',
            float: 'right',
          }}
        >
          {isApplicationInstalledInCompany(application.id) ? 'Remove' : 'Install'}
        </Button>
      }
    >
      <div style={{ margin: '0 22px' }}>
        <Col>
          {/* // TODO translation here */}
          <Text strong>Website:</Text>
        </Col>
        <Col>
          <Link onClick={() => window.open(application.identity.website, 'blank')}>
            {application.identity.website}
          </Link>
        </Col>

        <Col>
          {/* // TODO translation here */}
          <Text strong>Description:</Text>
        </Col>
        <Col>
          <Text type="secondary">{application.identity.description}</Text>
        </Col>

        <Col>
          {/* // TODO translation here */}
          <Text strong>Created:</Text>
        </Col>
        <Col>
          <Text type="secondary">{createdDate.fromNow()}</Text>
        </Col>

        <Col>
          {/* // TODO translation here */}
          <Text strong>Version:</Text>
        </Col>
        <Col>
          <Text type="secondary">{application.stats.version}</Text>
        </Col>
      </div>
    </ObjectModal>
  );
};
