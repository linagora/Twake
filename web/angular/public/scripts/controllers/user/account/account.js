angular.module('twake')
.config(function ($stateProvider) {
    $stateProvider
      //Account (identity - profile)
      .state('account-menu-left', {
        abstract: true,
        template: '<div ui-view=""></div>',
        parent: 'general',
        controller: 'accountMenuCtrl'
      })
      .state('account', {
        url:'/account',
        templateUrl: '@pviews/user/account/account.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      })
      .state('account-contacts', {
        url:'/account/contacts',
        templateUrl: '@pviews/user/account/contacts.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      })
      //Account parameters - gestion du compte & mails
      .state('account-parameters', {
        url:'/account/parameters',
        templateUrl: '@pviews/user/account/parameters.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      })
      //Account notifications
      .state('account-notifications', {
        url:'/account/notifications',
        templateUrl: '@pviews/user/account/notifications.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      })
      //Account mes groupes
      .state('account-groups', {
        url:'/account/groups',
        templateUrl: '@pviews/user/account/groups.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      })
      //Account transactions
      .state('account-transactions', {
        url:'/account/transactions',
        templateUrl: '@pviews/user/account/transactions.html',
        parent: 'account-menu-left',
        controller: 'accountMenuCtrl'
      });
})
.controller('accountMenuCtrl', function($rootScope, $scope){
  $rootScope.menuLeft.isAccount = true;
})
.controller('accountCtrl', function($api){

});
