import React, { useContext } from 'react';
import { MessageLinkType } from 'app/features/messages/types/message';
import './LinkPreview.scss';
import { useMessage } from 'app/features/messages/hooks/use-message';
import User from 'app/features/users/services/current-user-service';
import { MessageContext } from '../message-with-replies';
import { X } from 'react-feather';

type PropsType = {
  preview: MessageLinkType;
};

export default ({ preview }: PropsType): React.ReactElement => {
  const context = useContext(MessageContext);
  const { deleteLinkPreview, message } = useMessage(context);

  return (
    <div className="xs:max-w-xs max-w-md ant-card ant-card-bordered ant-card-small ant-card-type-inner link-preview">
      {message.user_id === User.getCurrentUserId() ? (
        <div className="delete-link-preview">
          <X size={16} onClick={() => deleteLinkPreview(preview.url)} />
        </div>
      ) : null}
      <div className="ant-card-body">
        <div className="ant-card-meta">
          <div className="ant-card-meta-detail">
            <div className="ant-card-meta-avatar">
              {preview.favicon && (
                <span className="ant-avatar ant-avatar-circle ant-avatar-image">
                  <img alt={preview.domain} src={preview.favicon} />
                </span>
              )}
              <span className="link-preview-domain">{preview.domain}</span>
            </div>
            <div className="preview-title">
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-ellipsis	w-full"
              >
                {preview.title}
              </a>
            </div>
            <div className="ant-card-meta-description">{preview.description}</div>
          </div>
        </div>
        {preview.img && (
          <div className="ant-card-cover">
            <img
              alt={preview.title}
              src={preview.img}
              onClick={() => window.open(preview.url, '_blank')}
              style={{
                maxWidth: preview.img_width ?? '100%',
                maxHeight: preview.img_height ?? '100%',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
