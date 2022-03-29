import React from 'react';
import { capitalize } from 'lodash';
import { Descriptions, Row, Typography } from 'antd';

import { TagPicker } from './tag-picker';
import { defaultApplicationScopes } from '../default-scopes';
import { Application, ApplicationScopes } from 'app/features/applications/types/application';
import { ApplicationHelp } from './application-help';

const { Text, Title } = Typography;
export const ApplicationAccess = ({
  application,
  onChangeApplicationAccess,
}: {
  application: Application;
  onChangeApplicationAccess?: (api: Application['access']) => void;
}) => {
  return (
    <>
      <Row>
        <Title level={3}>
          {/*  TODO:Translation here */}
          Select the right scopes for your application.
        </Title>
      </Row>
      <Row className="small-bottom-margin">
        <ApplicationHelp />
      </Row>
      {Object.keys(application.access).map((key: string) => {
        let currentScopes: ApplicationScopes[] = (application.access as any)[key];
        return (
          <div key={key === 'hooks' ? 'listened events' : key} className="bottom-margin">
            <Row>
              <Title level={5}>{capitalize(key === 'hooks' ? 'listened events' : key)}</Title>
            </Row>
            {defaultApplicationScopes ? (
              <TagPicker
                defaulActiveTags={currentScopes}
                onChange={tags =>
                  onChangeApplicationAccess &&
                  onChangeApplicationAccess({ ...application.access, [key]: tags })
                }
              />
            ) : (
              // TODO:Translation here
              <Text type="secondary">This integration doesn't have any {key} access</Text>
            )}
          </div>
        );
      })}
    </>
  );
};
