angular.module('twake')
.directive('ngClickout', function ($document) {
      return {
         restrict: 'A', // ng-clickout n'est disponible qu'en tant qu'attribute
         link: function ($scope, $element, $attr) {
            $element.bind('click', function (event) {
               event.stopPropagation(); // stop propagation pour ne pas rentrer dans le $document.click event
            });

            $document.bind('click', function () {
               // on a un click hors de l'élément donc on exécute la fonction définie dans l'attribut ng-clickout
               $scope.$apply($attr.ngClickout);
            });
         }
      };
});