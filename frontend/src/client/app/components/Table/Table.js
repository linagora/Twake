import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Emojione from 'components/Emojione/Emojione.js';
import Icon from 'components/Icon/Icon.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';

import './Table.scss';

export default class Table extends Component {
  /*
        props =  {
            column = {
                title: 'Name',
                dataIndex: 'name',
                render : function()
            }
            data = {
                name: `Edward King ${i}`,
                age: 32,
            }
        }
    }
    */
  constructor(props) {
    super(props);
    this.state = {
      i18n: Languages,
    };
    Languages.addListener(this);
  }
  componentWillMount() {
    this.state.workspaceLogo = false;
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  renderItem(col, item) {
    if (col.render) {
      return col.render(item);
    } else {
      return <div className="">{col.dataIndex ? item[col.dataIndex] : ''}</div>;
    }
  }
  render() {
    return (
      <div className={'table ' + (this.props.unFocused ? 'unfocused ' : '')}>
        {!this.props.noHeader && (
          <div className="headerTable">
            {this.props.column.map(col => {
              return (
                <div
                  className="headerItem"
                  style={{
                    width: col.width || 'inherit',
                    flex: col.width ? 'inherit' : '1',
                    textAlign: (col.titleStyle || {}).textAlign,
                  }}
                >
                  {col.title}
                </div>
              );
            })}
          </div>
        )}
        <div className="contentTable">
          {this.props.data.map(data => {
            return (
              <div className="tr">
                {this.props.column.map(col => {
                  return (
                    <div
                      className="item"
                      style={{ width: col.width || 'inherit', flex: col.width ? 'inherit' : '1' }}
                    >
                      {this.renderItem(col, data)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
