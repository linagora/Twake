import Globals from 'services/Globals.js';

Globals.window.addApiUrlIfNeeded = url => {
  if (!url) {
    return url;
  }
  if (/^http/.test(url)) {
    return url;
  }
  return Globals.window.api_root_url + url;
};

class GroupedQueryApi {
  post(route, data, callback) {
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
      var request = [];
      queries.forEach(query => {
        request.push(query.data);
      });
      Api.post(queries[0].route, { multiple: request }, res => {
        if (res.data && res.data.length) {
          res.data.forEach((result, i) => {
            queries[i] && queries[i].callback && queries[i].callback(result);
          });
        }
      });
    }, 50);
  }
}

const GroupedQueryApiInstance = new GroupedQueryApi();

export default class Api {
  static get(route, callback, raw) {
    route = Globals.window.api_root_url + '/ajax/' + route;

    Globals.request('GET', route, '', {}, resp => {
      if (raw) {
        callback(resp);
        return;
      }
      callback(JSON.parse(resp));
    });
  }

  static post(route, data, callback, raw, timeout) {
    if (data && data._grouped && route == 'core/collections/init') {
      GroupedQueryApiInstance.post(route, data, callback);
      return;
    }

    if (route.indexOf('http') !== 0) {
      route = Globals.window.api_root_url + '/ajax/' + route;
    }

    Globals.request(
      'POST',
      route,
      JSON.stringify(data),
      {},
      resp => {
        if (raw) {
          callback(resp);
          return;
        }
        var response = '';
        try {
          response = JSON.parse(resp);
        } catch (e) {
          console.log('Server internal error, bad JSON.');
          response = { errors: 'bad_json' };
        }
        callback(response);
      },
      timeout,
    );
  }

  static search(source, _query, collectionService, callback) {
    if (!this.searching_http_timeout) {
      this.searching_http_timeout = {};
    }
    if (!this.searching_javascript) {
      this.searching_javascript = {};
    }
    if (!this.searching_http) {
      this.searching_http = {};
    }
    if (!this.searching_last_query) {
      this.searching_last_query = {};
    }

    var query = _query;

    var http = source.http;
    var http_data = source.http_data || { query: query };

    var collection = null,
      collection_filter = null,
      collection_find_by = null;
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
        .filter(item => collection_filter(item, query));
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
          Api.post(http, http_data, res => {
            if (res.data) {
              if (collection) {
                res.data.forEach(item => {
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
          });
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

  static route(route) {
    return Globals.window.api_root_url + '/ajax/' + route;
  }
}
