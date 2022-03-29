import React from 'react';
import { Row, Typography } from 'antd';

import Emojione from 'app/components/emojione/emojione';

const { Text, Link } = Typography;
export const ApplicationHelp = () => (
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
