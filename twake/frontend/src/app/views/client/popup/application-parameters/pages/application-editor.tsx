import React, { useState } from 'react';

import {
  Tabs,
  Button,
  Typography,
  Col,
  Tag,
  Descriptions,
  Row,
  Divider,
  Input,
  Switch,
} from 'antd';
import { capitalize, isEqual } from 'lodash';

import { Application, ApplicationScopes } from 'app/features/applications/types/application';
import Languages from 'app/features/global/services/languages-service';
import AvatarComponent from 'app/components/avatar/avatar';
import ObjectModal from 'app/components/object-modal/object-modal';
import Emojione from 'app/components/emojione/emojione';
import AlertManager from 'app/features/global/services/alert-manager-service';

import '../../WorkspaceParameter/Pages/Applications/ApplicationsStyles.scss';

type PropsType = {
  application: Application;
  companyId: string;
};

const { TabPane } = Tabs;
const { Text, Link, Title, Paragraph } = Typography;
const { Item } = Descriptions;

const defaultScopes: ApplicationScopes[] = [
  'files',
  'applications',
  'workspaces',
  'users',
  'messages',
  'channels',
];

const ApplicationIdentity = ({
  application,
  onChangeApplicationIdentity,
}: {
  application: Application;
  onChangeApplicationIdentity?: (identity: Application['identity']) => void;
}) => {
  return (
    <Descriptions layout="vertical" bordered>
      <Item
        // TODO: Translation here
        label={'Name'}
        span={3}
      >
        <Input
          placeholder={Languages.t('scenes.app.popup.appsparameters.pages.amazing_app_name')}
          defaultValue={application.identity.name}
          onChange={e =>
            onChangeApplicationIdentity &&
            onChangeApplicationIdentity({
              ...application.identity,
              name: e.target.value,
            })
          }
        />
      </Item>

      <Item
        // TODO: Translation here
        label={'Code'}
        span={3}
      >
        <Input
          defaultValue={application.identity.code}
          onChange={e =>
            onChangeApplicationIdentity &&
            onChangeApplicationIdentity({
              ...application.identity,
              code: e.target.value,
            })
          }
        />
      </Item>

      <Item
        // TODO: Translation here
        label={'Icon'}
        span={3}
      >
        <Input
          defaultValue={application.identity.icon}
          onChange={e =>
            onChangeApplicationIdentity &&
            onChangeApplicationIdentity({
              ...application.identity,
              icon: e.target.value,
            })
          }
        />
      </Item>

      <Item
        // TODO: Translation here
        label={'Website'}
        span={3}
      >
        <Input
          defaultValue={application.identity.website}
          onChange={e =>
            onChangeApplicationIdentity &&
            onChangeApplicationIdentity({
              ...application.identity,
              website: e.target.value,
            })
          }
        />
      </Item>

      <Item
        // TODO: Translation here
        label={'Description'}
        span={3}
      >
        <Input.TextArea
          defaultValue={application.identity.description}
          onChange={e =>
            onChangeApplicationIdentity &&
            onChangeApplicationIdentity({
              ...application.identity,
              description: e.target.value,
            })
          }
        />
      </Item>
    </Descriptions>
  );
};

const ApplicationAPI = ({
  application,
  onChangeApplicationAPI,
}: {
  application: Application;
  onChangeApplicationAPI?: (api: Application['api']) => void;
}) => {
  const [showApiPrivateKey, setShowApiPrivateKey] = useState<boolean>(false);
  return (
    <Descriptions layout="vertical" bordered>
      <Item
        // TODO: Translation here
        label={Languages.t('scenes.app.popup.appsparameters.pages.public_login_label')}
        span={3}
      >
        <Text copyable>{application.id}</Text>
      </Item>
      <Item
        label={
          <Row>
            <Text className="small-right-margin">
              {/* TODO: Translation here */}
              Private key
            </Text>
            <Link onClick={() => setShowApiPrivateKey(!showApiPrivateKey)}>
              {/* TODO: Translation here */}
              {showApiPrivateKey ? 'Hide' : 'Show'}
            </Link>
          </Row>
        }
        span={3}
      >
        <Text
          copyable={{
            text: application.api?.private_key,
            onCopy: () => application.api?.private_key,
          }}
        >
          {showApiPrivateKey
            ? application.api?.private_key
            : '•••••••••••••••••••••••••••••••••••••'}
        </Text>
      </Item>

      <Item
        label={Languages.t('scenes.app.popup.appsparameters.pages.url_reception_events_label')}
        span={3}
      >
        <Input
          placeholder={'https://domain.com/api/twake/events'}
          defaultValue={application.api?.hooks_url}
          onChange={e => {
            e.target.value &&
              onChangeApplicationAPI &&
              onChangeApplicationAPI({ ...application.api, hooks_url: e.target.value });
          }}
        />
      </Item>

      <Item
        label={Languages.t('scenes.app.popup.appsparameters.pages.autorised_ip_adresses_label')}
        span={3}
      >
        <Row className="small-bottom-margin">
          <Text type="secondary">
            {Languages.t('scenes.app.popup.appsparameters.pages.filter_information')}
            {Languages.t('scenes.app.popup.appsparameters.pages.allowed_ip_adresses_method')}
          </Text>
        </Row>
        <Input
          defaultValue={application.api?.allowed_ips}
          placeholder={'ip1, ip2, ip3'}
          onChange={e => {
            e.target.value &&
              onChangeApplicationAPI &&
              onChangeApplicationAPI({ ...application.api, allowed_ips: e.target.value });
          }}
        />
      </Item>
    </Descriptions>
  );
};

const ApplicationDisplay = ({
  application,
  onChangeApplicationDisplay,
}: {
  application: Application;
  onChangeApplicationDisplay?: (api: Application['display']) => void;
}) => {
  const [error, setError] = useState<boolean>(false);

  return (
    <>
      <Input.TextArea
        status={error ? 'error' : ''}
        defaultValue={JSON.stringify(application.display, null, 2)}
        onChange={e => {
          try {
            const display = JSON.parse(e.target.value) as Application['display'];

            if (display && onChangeApplicationDisplay) {
              setError(false);

              onChangeApplicationDisplay(display);
            }
          } catch (e) {
            setError(true);
          }
        }}
        style={{ minHeight: 400 }}
      />
    </>
  );
};

const ApplicationAccess = ({
  application,
  onChangeApplicationAccess,
}: {
  application: Application;
  onChangeApplicationAccess?: (api: Application['access']) => void;
}) => {
  return (
    <Descriptions layout="vertical" bordered>
      {Object.keys(application.access).map((key: string) => {
        let currentScopes: ApplicationScopes[] = (application.access as any)[key];
        return (
          <Item
            label={capitalize(key === 'hooks' ? 'listened events' : key)}
            key={key === 'hooks' ? 'listened events' : key}
            span={3}
            style={{ padding: 8 }}
          >
            {defaultScopes ? (
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
          </Item>
        );
      })}
    </Descriptions>
  );
};

const TagPicker = ({
  defaulActiveTags,
  onChange,
}: {
  defaulActiveTags: ApplicationScopes[];
  onChange: (tags: ApplicationScopes[]) => void;
}) => {
  const [activeTags, setActiveTags] = useState<ApplicationScopes[]>(defaulActiveTags);

  const handleOnClickTag = (scope: ApplicationScopes) => {
    if (activeTags.includes(scope)) {
      setActiveTags(activeTags.filter(s => s !== scope));
      onChange(activeTags.filter(s => s !== scope));
    }

    if (!activeTags.includes(scope)) {
      setActiveTags([...activeTags, scope]);
      onChange([...activeTags, scope]);
    }
  };

  return (
    <>
      {defaultScopes.map(scope => {
        return (
          <Tag
            key={scope}
            color={activeTags.includes(scope) ? 'var(--success)' : 'var(--grey-dark)'}
            onClick={_e => handleOnClickTag(scope)}
            style={{ cursor: 'pointer' }}
          >
            {scope}
          </Tag>
        );
      })}
    </>
  );
};

const ApplicationPublication = ({
  application,
  onChangeApplicationPublication,
}: {
  application: Application;
  onChangeApplicationPublication?: (publication: Application['publication']) => void;
}) => (
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

    {application.publication.published && application.publication.pending && (
      <Row>
        <Text className="smalltext" style={{ opacity: 1 }}>
          <Emojione type={':information_source:'} />{' '}
          {Languages.t('scenes.app.popup.appsparameters.pages.available_publication_alert')}
        </Text>
      </Row>
    )}

    <Row>
      <Text className="small-right-margin">
        {Languages.t('scenes.app.popup.appsparameters.pages.publish_app_label')}
      </Text>
      <Switch
        defaultChecked={application.publication.published}
        onChange={e =>
          onChangeApplicationPublication &&
          onChangeApplicationPublication({ ...application.publication, published: e })
        }
      />
    </Row>
  </>
);

const ApplicationDangerousZone = ({ application }: { application: Application }) => {
  const removeApplication = () => {
    console.log('removeApplication');
  };

  return (
    <>
      <Row className="small-top-margin">
        <Title level={5}>
          {Languages.t('scenes.app.popup.appsparameters.pages.danger_zone_label')}
        </Title>
      </Row>

      <Row className="small-bottom-margin">
        <Text type="warning">
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

const NeedSomeHelp = () => (
  <Row align="middle" justify="start" className="bottom-margin">
    <Text type="secondary">
      {/* TODO:Translation here */}
      <Emojione type=":exploding_head:" /> If you do not know how to fill these, go to{' '}
      <Link onClick={() => window.open('https://doc.twake.app', 'blank')}>
        {/* TODO:Translation here */}
        the Twake API documentation
      </Link>
    </Text>
  </Row>
);

const ApplicationEditor = ({ application, companyId }: PropsType) => {
  const [updatedApp, setUpdatedApp] = useState<Application>(application);

  const onSave = () => {};

  return (
    <ObjectModal
      className="company-application-popup"
      headerStyle={{ height: 32, marginTop: 24 }}
      footerDividerStyle={{ marginTop: 0 }}
      closable
      style={{ minHeight: 681 }}
      title={
        <Row align="middle" justify="start">
          <Col>
            <AvatarComponent url={application.identity.icon} />
          </Col>
          <Col className="small-x-margin">
            <Title level={3} style={{ margin: 0 }}>
              {application.identity.name}
            </Title>
          </Col>
        </Row>
      }
      footer={
        <Row wrap={false}>
          <Button type="ghost" disabled={isEqual(application, updatedApp)} onClick={onSave}>
            {/* TODO: Translation here */}
            save
          </Button>
        </Row>
      }
    >
      <Divider style={{ margin: '16px 0 0 0' }} />

      <Tabs defaultActiveKey="1" tabPosition="left">
        <TabPane
          // TODO:Translation here
          tab={'Identity'}
          key={1}
        >
          <ApplicationIdentity
            application={application}
            onChangeApplicationIdentity={identity => setUpdatedApp({ ...updatedApp, identity })}
          />
        </TabPane>

        <TabPane
          // TODO:Translation here
          tab="API"
          key={2}
        >
          <ApplicationAPI
            application={application}
            onChangeApplicationAPI={api => setUpdatedApp({ ...updatedApp, api })}
          />
        </TabPane>

        <TabPane
          // TODO:Translation here
          tab="Display"
          key={3}
        >
          <NeedSomeHelp />
          <ApplicationDisplay
            application={application}
            onChangeApplicationDisplay={display => setUpdatedApp({ ...updatedApp, display })}
          />
        </TabPane>

        <TabPane
          // TODO: Translation here
          tab="Access"
          key={4}
        >
          <NeedSomeHelp />
          <ApplicationAccess
            application={application}
            onChangeApplicationAccess={access => setUpdatedApp({ ...updatedApp, access })}
          />
        </TabPane>

        <TabPane
          tab={Languages.t('scenes.app.popup.appsparameters.pages.publication_label')}
          key={5}
        >
          <ApplicationPublication
            application={application}
            onChangeApplicationPublication={publication =>
              setUpdatedApp({ ...updatedApp, publication })
            }
          />
        </TabPane>

        <TabPane
          tab={Languages.t('scenes.app.popup.appsparameters.pages.danger_zone_label')}
          key={6}
        >
          <ApplicationDangerousZone application={application} />
        </TabPane>
      </Tabs>
    </ObjectModal>
  );
};

export default ApplicationEditor;
