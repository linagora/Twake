import Login from 'services/login/login';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Api from 'services/Api';
import Languages from 'services/languages/languages';
import { UserType } from 'app/models/User';
import { TwakeService } from 'services/Decorators/TwakeService';
import { addApiUrlIfNeeded, getAsFrontUrl } from 'app/services/utils/URLUtils';

type SearchQueryType = {
  searching: boolean;
  previous: string;
  current: string;
  timeout_search?: ReturnType<typeof setTimeout>;
};

@TwakeService('UserService')
class User {
  private users_repository: typeof Collections;
  private searchQueries: SearchQueryType;

  constructor() {
    this.users_repository = Collections.get('users');
    Collections.updateOptions('users', { base_url: 'users', use_cache: true });
    this.searchQueries = {
      searching: false,
      previous: '',
      current: '',
    };
  }

  getCurrentUser(): UserType & { id: string } {
    return Collections.get('users').find(Login.currentUserId);
  }

  getCurrentUserId(): string {
    return Login.currentUserId;
  }

  getFullName(user: Pick<UserType, 'username' | 'firstname' | 'lastname' | 'deleted'>): string {
    let name: string = user?.username;

    if (!name) {
      return '';
    }

    if (user.deleted) {
      name = Languages.t('general.user.deleted');
    }

    if (user.firstname?.length) {
      name = user.firstname;
    }

    if (user.firstname?.length && user.lastname?.length) {
      name = `${user.firstname} ${user.lastname}`;
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  getThumbnail(user: UserType) {
    let thumbnail = '';

    if (!user) {
      return thumbnail;
    }

    if (!user || !user.thumbnail || user.thumbnail === '') {
      let output = 0;
      const string = user?.id || '';
      for (let i = 0; i < string.length; i++) {
        output += string[i].charCodeAt(0);
      }
      const i = output % 100;
      thumbnail = getAsFrontUrl(`/public/identicon/${i}.png`);
    } else {
      thumbnail = addApiUrlIfNeeded(user.thumbnail);
    }

    if (user.deleted) {
      thumbnail = '';
    }

    return thumbnail;
  }

  search(
    query: string = '',
    options: { scope: string; workspace_id: string; group_id: string },
    callback: (users: UserType[]) => void = () => {},
    noHttp?: boolean,
    didTimeout?: boolean,
  ) {
    const scope = options.scope;

    if (query === 'me') {
      query = this.getCurrentUser().username;
    }

    this.searchQueries.current = query;

    if (query.length === 0) {
      callback([]);
      return;
    }

    //First search with known data
    const res: UserType[] = [];
    Collections.get('users')
      .findBy({})
      .forEach((user: UserType) => {
        if (
          `${user.username} ${user.firstname} ${user.lastname} ${user.email}`
            .toLocaleLowerCase()
            .indexOf(query.toLocaleLowerCase()) >= 0
        ) {
          let in_scope = true;
          if (scope === 'workspace') {
            in_scope = (user.workspaces_id || []).indexOf(options.workspace_id) >= 0;
          }
          if (scope === 'group') {
            in_scope = (user.groups_id || []).indexOf(options.group_id) >= 0;
          }
          if (in_scope) {
            res.push(user);
          }
        }
        if (res.length > 30) {
          return false;
        }
      });

    callback(res);

    if (res.length > 5) {
      return;
    }

    //Then search on server
    if (noHttp || query.length < 2 || (this.searchQueries.previous || '').startsWith(query)) {
      this.searchQueries.previous = query;
      return;
    }
    this.searchQueries.previous = query;

    if (this.searchQueries.timeout_search) {
      clearTimeout(this.searchQueries.timeout_search);
    }
    if (this.searchQueries.searching) {
      this.searchQueries.timeout_search = setTimeout(() => {
        this.search(query, options, callback, false, true);
      }, 1000);
      return;
    }

    this.searchQueries.searching = true;
    setTimeout(
      () => {
        Api.post(
          'users/all/search',
          {
            options: {
              scope: scope,
              name: query,
              workspace_id: options.workspace_id,
              group_id: options.group_id,
              language_preference: this.getCurrentUser().language,
            },
          },
          (res: { [key: string]: any }) => {
            this.searchQueries.searching = false;
            if (res.data && res.data.users) {
              res.data.users.forEach((item: any) => {
                this.users_repository.updateObject(item[0]);
              });
              this.search(query, options, callback, true, true);
            }
          },
        );
      },
      didTimeout ? 0 : 1000,
    );
  }

  // member - guest - admin - unknown
  getUserRole(user: any, companyId?: string) {
    const currentUserCompany = (user?.companies || []).filter(
      (item: any) => item.company.id === companyId,
    )[0];

    return currentUserCompany?.role || 'unknown';
  }
}

export default new User();
