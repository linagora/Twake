import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';
import Pagination from 'components/Table/Pagination';
import Button from 'components/Buttons/Button.js';
import InputIcon from 'components/Inputs/InputIcon.js';
import './Table.scss';

type Props = {
  column?: any;
  noHeader: boolean;
  onAdd: () => void;
  onRequestNextPage: (pageToken: string, maxResults: number) => Promise<any[]>;
  onSearch: (query: string, maxResults: number) => Promise<any[]>;
  resultsPerPage?: number;
  unFocused: boolean;
};
type State = {
  data: null | any[];
  loading: boolean;
};

export default class Table extends Component<Props, State> {
  searchFieldValue: string = '';

  constructor(props: Props) {
    super(props);
    this.state = {
      data: null,
      loading: true,
    };
    Languages.addListener(this);
  }

  componentWillUnmount() {
    Languages.removeListener(this);
  }

  componentDidMount() {
    if (this.state.data === null && this.props.onRequestNextPage) {
      this.props
        .onRequestNextPage('', this.props.resultsPerPage || 10)
        .then(data => {
          this.setState({ data: data, loading: false });
        })
        .catch(e => console.log(e));
    }
    if (this.state.data === null && this.props.onSearch) {
      this.props
        .onSearch(this.searchFieldValue, 10)
        .then(data => {
          console.log(this.searchFieldValue);
          if (this.searchFieldValue.length) this.setState({ data: data, loading: false });
          else this.setState({ data: data, loading: true });
        })
        .catch(e => console.log(e));
    }
  }

  renderItem(col: any, item: any) {
    if (col.render) {
      return col.render(item);
    } else {
      return <div className="">{col.dataIndex ? item[col.dataIndex] : ''}</div>;
    }
  }

  setPosition() {
    if (this.props.onSearch && !this.props.onAdd) return 'flex-end';
    else return 'space-between';
  }

  render() {
    return (
      <div>
        {(this.props.onAdd || this.props.onSearch) && (
          <div
            className="small-y-margin full-width"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: this.setPosition(),
            }}
          >
            {this.props.onAdd && (
              <Button
                class="medium"
                value={Languages.t(
                  'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
                  'Add collaborators',
                )}
              />
            )}
            {this.props.onSearch && (
              <div>
                <InputIcon
                  icon="search"
                  small
                  placeholder={Languages.t(
                    'scenes.app.mainview.advanced_search_placeholder',
                    'Advanced search',
                  )}
                  onChange={(event: any) => {
                    this.searchFieldValue = event.target.value;
                    this.props.onSearch(this.searchFieldValue, this.props.resultsPerPage || 10);
                  }}
                />
              </div>
            )}
          </div>
        )}
        <div
          className={
            'table ' +
            (this.props.unFocused ? 'unfocused ' : '') +
            (this.state.loading ? 'loading ' : '')
          }
        >
          {!this.props.noHeader && (
            <div className="headerTable">
              {this.props.column.map((col: any) => {
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
            {(this.state.data || []).map((data: any) => {
              return (
                <div className="tr">
                  {this.props.column.map((col: any) => {
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
          <div className="footerTable">
            <Pagination small />
          </div>
        </div>
      </div>
    );
  }
}
