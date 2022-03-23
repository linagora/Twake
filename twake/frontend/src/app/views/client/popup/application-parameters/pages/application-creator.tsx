import React, { useEffect, useState } from 'react';
import { Input, Row, Typography, Button, Col, Checkbox } from 'antd';

import Languages from 'app/features/global/services/languages-service';
import AlertManager from 'app/features/global/services/alert-manager-service';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import ApplicationsAPIClient from 'app/features/applications/api/applications-api-client';
import { buildDefaultApplicationPayload } from 'app/features/applications/utils/application';
import CompanyApplicationPopup from '../../WorkspaceParameter/Pages/Applications/CompanyApplicationPopup';
import ModalManager from 'app/components/modal/modal-manager';
import ObjectModal from 'app/components/object-modal/object-modal';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';

import './pages.scss';

type ErrorObjectStateType = { statusCode: number; message: string; error: string };

const ErrorComponent = ({ error }: { error: ErrorObjectStateType }) => (
  <Text type="danger">
    {/* TODO:translation here */}
    Error {error.statusCode}, {error.error} - {error.message}
  </Text>
);

const { Text, Title } = Typography;
const ApplicationCreator = () => {
  const { company } = useCurrentCompany();
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [appDescription, setAppDescription] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [disabledBtn, setDisabledBtn] = useState<boolean>(true);
  const [error, setError] = useState<ErrorObjectStateType | undefined>(undefined);

  const { add: addOneCompanyApplication } = useCompanyApplications(company.id);

  const handleDisabledBtn = (inputValue?: string) => {
    if (inputValue?.length) {
      setDisabledBtn(false);
    }

    if (!inputValue?.length) {
      setDisabledBtn(true);
    }
  };

  useEffect(() => {
    handleDisabledBtn(appName);
  }, [appName]);

  const convertToSimpleName = (value: string) => {
    value = value || '';
    value = value.toLocaleLowerCase();
    value = value.replace(/[^a-z0-9]/g, '_');
    value = value.replace(/_+/g, '_');
    value = value.replace(/^_+/g, '');
    return value;
  };

  const clearFields = () => {
    setAppName(undefined);
    setAppDescription(undefined);
    setDisabledBtn(true);
  };

  const createApp = async () => {
    setLoading(true);

    const applicationPayload = buildDefaultApplicationPayload();

    if (company.id) {
      applicationPayload.company_id = company.id;
    }

    if (appName) {
      applicationPayload.identity.name = appName;
      applicationPayload.identity.code = convertToSimpleName(appName);
    }

    if (appDescription) {
      applicationPayload.identity.description = appDescription;
    }

    try {
      const application = await ApplicationsAPIClient.createCustomApplication(applicationPayload);

      if (application) {
        addOneCompanyApplication(application.id)
          .then(() => ModalManager.closeAll)
          .finally(() => {
            ModalManager.open(
              <CompanyApplicationPopup application={application} companyId={company.id} />,
              {
                position: 'center',
                size: { width: '600px' },
              },
            );
          });
      }
      // FIXME: This is no longer an application but an error
      const err = application as unknown as ErrorObjectStateType;

      if (err?.message?.length) {
        setError(err);
      }
    } catch (e) {
      console.error(e);
    }

    clearFields();

    setLoading(false);
  };

  return (
    <ObjectModal
      closable
      title={
        /* TODO:translation here */
        'New integration'
      }
      footer={
        <Button
          type="primary"
          disabled={loading || disabledBtn || !checked}
          loading={loading}
          onClick={() => AlertManager.confirm(createApp)}
          style={{
            width: 'auto',
            float: 'right',
          }}
        >
          {Languages.t('scenes.app.popup.appsparameters.pages.create_my_app')}
        </Button>
      }
    >
      <div className="x-margin">
        {error && (
          <Row className="small-bottom-margin">
            <ErrorComponent error={error} />
          </Row>
        )}

        <Row className="small-bottom-margin">
          {/* TODO:translation here */}
          <Title level={5}>Name</Title>
        </Row>
        <Row className="small-bottom-margin">
          <Input
            placeholder={Languages.t('scenes.app.popup.appsparameters.pages.amazing_app_name')}
            type="text"
            disabled={loading}
            value={appName}
            onChange={e => setAppName(e.target.value)}
          />
        </Row>

        <Row className="small-bottom-margin" wrap={false}>
          {/* TODO:translation here */}
          <Col className="small-right-margin">
            <Title level={5}>Description</Title>
          </Col>
          <Col>
            <Text type="secondary">Optionnal</Text>
          </Col>
        </Row>
        <Row className="small-bottom-margin">
          <Input.TextArea
            placeholder={'Describe your application in a few words'}
            disabled={loading}
            value={appDescription}
            onChange={e => setAppDescription(e.target.value)}
          />
        </Row>

        <Row className="small-bottom-margin">
          <Text type="secondary">
            <Checkbox
              className="small-right-margin"
              checked={checked}
              onChange={_e => setChecked(!checked)}
            >
              {/* TODO:translation here */}I understand that the owner and administrators of this
              company will be able to modify and publish this application.
            </Checkbox>
          </Text>
        </Row>
      </div>
    </ObjectModal>
  );
};

export default ApplicationCreator;
