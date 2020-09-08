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
  onRequestMore: (refresh: boolean) => Promise<any[]>;
  onSearch: (query: string, maxResults: number, callback: (res: any[]) => void) => Promise<any[]>;
  addText?: string;
  resultsPerPage?: number;
  unFocused: boolean;
};
type State = {
  data: null | any[];
  searchResults: any[];
  loading: boolean;
  has_more: boolean;
  page: number;
  searchFieldValue: string;
};

export default class Table extends Component<Props, State> {
  searchFieldValue: string = '';

  constructor(props: Props) {
    super(props);
    this.state = {
      data: null,
      searchResults: [],
      loading: true,
      has_more: true,
      page: 0,
      searchFieldValue: '',
    };
    Languages.addListener(this);
  }

  componentWillUnmount() {
    Languages.removeListener(this);
  }

  componentDidMount() {
    if (this.state.data === null) {
      this.requestMore();
    }
  }

  search() {
    this.props.onSearch(this.state.searchFieldValue, 10, (data: any[]) => {
      console.log(this.searchFieldValue);
      this.setState({
        searchResults: data.map(i => {
          return { user: i };
        }),
      });
    });
  }

  renderItem(col: any, item: any) {
    if (col.render) {
      return col.render(item);
    } else {
      return <div className="">{col.dataIndex ? item[col.dataIndex] : ''}</div>;
    }
  }

  requestMore() {
    this.setState({ loading: true });
    this.props.onRequestMore(false).then(res => {
      const hasMore = res.length !== (this.state.data || []).length;
      console.log(hasMore);
      this.setState({ loading: false, data: res, has_more: hasMore });
    });
  }

  setPosition() {
    if (this.props.onSearch && !this.props.onAdd) return 'flex-end';
    else return 'space-between';
  }

  nextPage() {
    this.setState({ page: this.state.page + 1 });
    if (this.getPageData().length < (this.state.page + 1) * this.getResultsPerPage()) {
      this.requestMore();
    }
  }

  getPageData() {
    const from = this.state.page * this.getResultsPerPage();
    return (this.state.data || []).slice(0, from + this.getResultsPerPage());
  }

  getResultsPerPage(): number {
    return this.props.resultsPerPage || 50;
  }

  render() {
    const page_data =
      this.state.searchFieldValue.length > 0 ? this.state.searchResults : this.getPageData();

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
                value={this.props.addText || 'Add'}
                onClick={this.props.onAdd}
              />
            )}
            {this.props.onSearch && (
              <div>
                <InputIcon
                  icon="search"
                  small
                  placeholder={Languages.t('components.listmanager.filter', 'Search')}
                  onChange={(event: any) => {
                    const q = event.target.value;
                    this.setState({ searchFieldValue: q });
                    this.search();
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
            {(page_data || []).length === 0 &&
              !!this.state.loading &&
              Array.apply(null, Array(this.getResultsPerPage())).map(() => {
                return (
                  <div className="tr">
                    <div className="item">
                      <div className="line"></div>
                    </div>
                  </div>
                );
              })}
            {(page_data || []).map((data: any) => {
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
          {this.state.searchFieldValue.length === 0 && !!this.state.has_more && (
            <div className="footerTable">
              <a href="#" onClick={() => this.nextPage()}>
                {Languages.t('components.searchpopup.load_more', [], 'Load more results')}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
}
