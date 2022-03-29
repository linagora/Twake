import React from 'react';

import { Button, Row, Typography } from 'antd';
import { Application } from 'app/features/applications/types/application';

import Languages from 'app/features/global/services/languages-service';
import Emojione from 'app/components/emojione/emojione';
import AlertManager from 'app/features/global/services/alert-manager-service';
import ApplicationsAPIClient from 'app/features/applications/api/applications-api-client';
import { ToasterService } from 'app/features/global/services/toaster-service';

const { Title, Text } = Typography;

export const ApplicationPublication = ({ application }: { application: Application }) => {
  const removeApplication = async () => {
    const res = await ApplicationsAPIClient.delete(application.id);

    if (res.status === 'success')
      ToasterService.success(
        // TODO: Translation here
        `Successfully removed application ${application.identity.name} !`,
      );
    else {
      ToasterService.error(
        // TODO: Translation here
        `Error while removing application ${application.identity.name} !`,
      );
    }
  };

  const publishApplication = async () => {
    const publication: Application['publication'] = {
      ...application.publication,
      requested: application.publication.published ? false : true,
    };

    const res = await ApplicationsAPIClient.save(application.id, { ...application, publication });

    if (res)
      ToasterService.success(
        // TODO: Translation here
        `Successfully ${res.publication.published ? 'published' : 'unpublished'} application!`,
      );
  };

  return (
    <>
      <Row>
        <Title level={5}>
          {Languages.t('scenes.app.popup.appsparameters.pages.publication_description')}
        </Title>
      </Row>

      <Row className="bottom-margin">
        <Text type="secondary">
          {Languages.t('scenes.app.popup.appsparameters.pages.parameters_form_small_text')}
        </Text>
      </Row>

      {application.publication.published && application.publication.requested && (
        <Row>
          <Text className="smalltext" style={{ opacity: 1 }}>
            <Emojione type={':information_source:'} />{' '}
            {Languages.t('scenes.app.popup.appsparameters.pages.available_publication_alert')}
          </Text>
        </Row>
      )}

      <Row className="bottom-margin">
        <Button type="primary" onClick={() => AlertManager.confirm(() => publishApplication())}>
          {application.publication.published || application.publication.requested
            ? 'Unpublish application'
            : Languages.t('scenes.app.popup.appsparameters.pages.publish_app_label')}
        </Button>
      </Row>

      <Row>
        <Title level={5}>
          {Languages.t('scenes.app.popup.appsparameters.pages.danger_zone_label')}
        </Title>
      </Row>

      <Row className="bottom-margin">
        <Text type="secondary">
          {Languages.t('scenes.app.popup.appsparameters.pages.danger_zone_small_text')}
        </Text>
      </Row>

      <Row>
        <Button
          type="text"
          style={{ backgroundColor: 'var(--error)', color: 'var(--white)' }}
          onClick={() => AlertManager.confirm(removeApplication)}
        >
          {Languages.t('scenes.app.popup.appsparameters.pages.remove_app_button')}
        </Button>
      </Row>
    </>
  );
};
