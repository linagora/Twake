import { Button, Col, Row, Input } from 'antd';
import React from 'react';

export default () => {
  const [isInvitationLink, setIsInvitationLink] = React.useState(false);
  const [invitationLink, setInvitationLink] = React.useState('');
  return (
    <div className="go-a-link">
      <span className={isInvitationLink ? '' : 'link'} onClick={() => setIsInvitationLink(true)}>
        Got an invitation link ?
      </span>
      {isInvitationLink && (
        <div className="invitation-link" style={{ margin: 'auto', marginTop: 8, maxWidth: 400 }}>
          <Row align="middle" justify="space-between">
            <Col flex="auto" className="small-right-margin">
              <Input
                placeholder={'Copy and paste it here'}
                onChange={e => setInvitationLink(e.target.value)}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                disabled={
                  !invitationLink.match(
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[a-zA-Z0-9()]{1,6}|:[0-9]{2,4})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
                  )
                }
                onClick={() => document.location.replace(invitationLink)}
              >
                Use it
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};
