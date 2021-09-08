import Globals from 'services/Globals';
import Requests from 'services/Requests';

class GroupedQueryApi {
  private groupedQueryBuffer: any;
  private groupedQueryTimeout: any;

  post(route: string, data: any, callback: any) {
    if (!this.groupedQueryBuffer) {
      this.groupedQueryBuffer = [];
    }
    this.groupedQueryBuffer.push({
      route: route,
      data: data,
      callback: callback,
    });
    if (this.groupedQueryTimeout) {
      clearTimeout(this.groupedQueryTimeout);
    }
    this.groupedQueryTimeout = setTimeout(() => {
      var queries = this.groupedQueryBuffer;
      this.groupedQueryBuffer = [];
      const request: any[] = [];
      queries.forEach((query: any) => {
        request.push(query.data);
      });
      Api.post(
        queries[0].route,
        { multiple: request },
        (res: any) => {
          if (res.data && res.data.length) {
            res.data.forEach((result: any, i: string | number) => {
              queries[i] && queries[i].callback && queries[i].callback(result);
            });
          }
        },
        false,
      );
    }, 50);
  }
}

const GroupedQueryApiInstance = new GroupedQueryApi();

export default class Api {
  static get(
    route: string,
    callback: any = false,
    raw: boolean = false,
    options: { disableJWTAuthentication?: boolean } = {},
  ) {
    return new Promise((resolve, reject) => {
      route = Globals.api_root_url + route;

      Requests.request(
        'get',
        route,
        '',
        (resp: any) => {
          if (raw) {
            resolve(resp);
            if (callback) callback(resp);
            return;
          }
          resolve(JSON.parse(resp));
          if (callback) callback(JSON.parse(resp));
        },
        options,
      );
    });
  }

  static put(
    route: string,
    data: any,
    callback: any = false,
    raw: boolean = false,
    options: {
      disableJWTAuthentication?: boolean;
    } = {},
  ) {
    return Api.request(route, data, callback, raw, { ...options, requestType: 'put' });
  }

  static post(
    route: string,
    data: any,
    callback: any = false,
    raw: boolean = false,
    options: {
      disableJWTAuthentication?: boolean;
    } = {},
  ) {
    return Api.request(route, data, callback, raw, { ...options, requestType: 'post' });
  }

  static delete(
    route: string,
    data: any,
    callback: any = false,
    raw: boolean = false,
    options: {
      disableJWTAuthentication?: boolean;
    } = {},
  ) {
    return Api.request(route, data, callback, raw, { ...options, requestType: 'delete' });
  }

  static request(
    route: string,
    data: any,
    callback: any = false,
    raw: boolean = false,
    options: {
      disableJWTAuthentication?: boolean;
      requestType?: 'post' | 'get' | 'put' | 'delete';
    } = {},
  ) {
    return new Promise((resolve, reject) => {
      if (data && data._grouped && route === 'core/collections/init') {
        GroupedQueryApiInstance.post(route, data, callback);
        return;
      }

      route = Globals.api_root_url + route;

      Requests.request(
        options.requestType ? options.requestType : 'post',
        route,
        JSON.stringify(data),
        (resp: any) => {
          if (raw) {
            resolve(resp);
            if (callback) callback(resp);
            return;
          }
          let response: any = '';
          try {
            response = JSON.parse(resp);
          } catch (e) {
            console.log('Server internal error, bad JSON.');
            response = { errors: 'bad_json' };
          }
          resolve(response);
          if (callback) callback(response);
        },
        options,
      );
    });
  }

  static searching_last_query: any;
  static searching_http_timeout: any;
  static searching_http: any;
  static searching_javascript: any;

  static search(source: any, _query: any, collectionService: any, callback: any) {
    if (!Api.searching_http_timeout) {
      Api.searching_http_timeout = {};
    }
    if (!Api.searching_javascript) {
      Api.searching_javascript = {};
    }
    if (!Api.searching_http) {
      Api.searching_http = {};
    }
    if (!this.searching_last_query) {
      Api.searching_last_query = {};
    }

    var query = _query;

    var http = source.http;
    var http_data = source.http_data || { query: query };

    let collection: any = null,
      collection_filter: any = null,
      collection_find_by: any = null;
    if (source.collection && collectionService.get) {
      collection = collectionService.get(source.collection);
      collection_find_by = source.collection_find_by || {};
      collection_filter =
        source.collection_filter ||
        (() => {
          return true;
        });
    }

    var search_key = source.http + '_' + source.collection;
    this.searching_last_query[search_key] = query;

    //JavaScript search
    if (collection && !this.searching_javascript[search_key]) {
      this.searching_javascript[search_key] = true;
      var results = collection
        .findBy(collection_find_by)
        .filter((item: any) => collection_filter(item, query));
      callback(results);
      this.searching_javascript[search_key] = false;
    }

    //HTTP Search
    if (http) {
      if (this.searching_http_timeout[search_key]) {
        clearTimeout(this.searching_http_timeout[search_key]);
      }

      if (!this.searching_http[search_key]) {
        this.searching_http[search_key] = true;

        try {
          Api.post(
            http,
            http_data,
            (res: any) => {
              if (res.data) {
                if (collection) {
                  res.data.forEach((item: any) => {
                    collection.completeObject(item, item.front_id);
                  });
                  collection.notify();

                  delete source.http;
                  delete source.http_data;
                  Api.search(
                    source,
                    this.searching_last_query[search_key],
                    collectionService,
                    callback,
                  );
                } else {
                  callback && callback(res.data);
                }

                this.searching_http[search_key] = false;
              }
            },
            false,
          );
        } catch (e) {
          this.searching_http[search_key] = false;
        }
      } else {
        this.searching_http_timeout[search_key] = setTimeout(() => {
          Api.search(source, query, collectionService, callback);
        }, 500);
      }
    }
  }

  static route(route: string) {
    return Globals.api_root_url + route;
  }
}

(window as any).Api = Api;
