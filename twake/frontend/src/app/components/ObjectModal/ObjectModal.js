import React, {Component} from 'react';
import Icon from 'components/Icon/Icon.js';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Tabs from 'components/Tabs/Tabs.js';
import './ObjectModal.scss';

export class ObjectModalTitle extends React.Component {
  render() {
    return (
      <div className={'modal_title ' + this.props.className} style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}

export class ObjectModalSectionTitle extends React.Component {
  render() {
    return (
      <div className={'section_title ' + this.props.className} style={this.props.style}>
        {this.props.icon && <Icon type={this.props.icon} className="m-icon-small" />}
        <span>{this.props.name}</span>
      </div>
    );
  }
}

export class ObjectModal extends React.Component {
  constructor(props) {
    super();
    this.state = {};
  }
  render() {
    return (
      <div className={'object_modal ' + this.props.className}>
        <div className="top_right_buttons">
          {this.props.onEdit && (
            <div className="square_button" onClick={this.props.onEdit}>
              <Icon type="edit-alt" className="m-icon-small" />
            </div>
          )}
          {this.props.onClose && (
            <div className="square_button" onClick={this.props.onClose}>
              <Icon type="times" className="m-icon-small" />
            </div>
          )}
        </div>

        <div className="title">{this.props.title}</div>

        {this.props.tabs && (
          <Tabs
            tabs={this.props.tabs.map(item => {
              return {
                title: item.title || '',
                render: (
                  <div className="body">
                    <PerfectScrollbar options={{ suppressScrollX: true }} component="div">
                      {item.render}
                    </PerfectScrollbar>
                  </div>
                ),
              };
            })}
          />
        )}

        {!this.props.tabs && (
          <div className="body">
            <PerfectScrollbar options={{ suppressScrollX: true }} component="div">
              {this.props.children}
            </PerfectScrollbar>
          </div>
        )}

        {this.props.footer && <div class="separator" style={{ marginTop: 0 }} />}
        {this.props.footer && <div className="footer">{this.props.footer}</div>}
      </div>
    );
  }
}
