import React from 'react';
import { MessageLinkType } from 'app/features/messages/types/message';
import './LinkPreview.scss';
import { Image } from 'antd';

type PropsType = {
  preview: MessageLinkType;
};

export default ({ preview }: PropsType): React.ReactElement => (
  <div className="ant-card ant-card-bordered ant-card-small ant-card-type-inner link-preview">
    <div className="ant-card-body">
      <div className="ant-card-meta">
        <div className="ant-card-meta-detail">
          <div className="ant-card-meta-avatar">
            <span className="ant-avatar ant-avatar-circle ant-avatar-image">
              <img alt={preview.domain} src={preview.favicon} />
            </span>
          </div>
          <div className="ant-card-meta-title">
            <a href={preview.url}>{preview.title}</a>
          </div>
          <span className="link-preview-domain">{preview.domain}</span>
          <div className="ant-card-meta-description">{preview.description}</div>
        </div>
      </div>
      <div className="ant-card-cover">
        <Image alt={preview.title} src={preview.img} />
      </div>
    </div>
  </div>
);
