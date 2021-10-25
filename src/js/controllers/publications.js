/**
 * @ngdoc function
 * @name miller.controller:PublicationCtrl
 * @description
 * # PublicationCtrl
 * Handle the publication page.
 */
angular.module('miller')
  .controller('PublicationsCtrl', function ($scope, $filter, $log, $state, $timeout, $q, AuthorFactory, TagFactory, RUNTIME, EVENTS) {
    $log.log('🔭 PublicationsCtrl welcome');
    // the list of links, both main writings and other secondary writings.
    $scope.rootStatename = 'publications';
    $scope.mainStatename = 'publications.all';
    $scope.mainRoutes    = $scope.user.is_staff? RUNTIME.routes.publications.status: [];

    $scope.getTranslation = function (translationId) {
      return $filter('translate')(translationId)
    };

    var availableRoutes = RUNTIME.routes.publications.availableRoutes || ['writing', 'tags'];

    $scope.availableRoutes = availableRoutes.map(function(d){
      var sortBasics = function (arr) {
        return d === 'writing' || d === 'tags'
          ? arr.sort(function (a, b) {
            return (a.slug > b.slug) ? 1 : -1
          })
          : arr
      }
      $log.log("HIIIIER" + d);
      $log.log( RUNTIME.routes.publications[d]);
      return {
        state: 'publications',
        urls: sortBasics(RUNTIME.routes.publications[d])
      }
    });

    // if there is a tag, we want to get its multilingual value
    $scope.setTag = function(tag) {
      if(tag)
        $log.log('🔭 PublicationsCtrl -> setTag - slug:', tag.slug, '- name:', tag.name);
      $scope.tag = tag;
    }

    // list of service premises to build the hallof fames
    var HallOfFames = [];


    $scope.hallOfFame = {};

    $scope.sync = function(){
      // transform filterrs from initials (they are for publication story, not for story.authors)
      var initials = $state.current.resolve.initials(),
          params = {
            limit: 10
          },
          filters = {},
          exclude = {},
          ordering;

      $scope.availabileOrderby = initials.availabileOrderby;
      ordering = _.get(_.find($scope.availabileOrderby, {value: $scope.qs.orderby}),'label')

      if(!ordering && initials.orderby)
        ordering = _.get(_.find($scope.availabileOrderby, {value: initials.orderby}),'label')

      if(!ordering)
        ordering = 'newest';

      $scope.ordering =  ordering;

      if(initials.filters){
        if($scope.state == 'publications.tags')
          initials.filters['tags__slug__all'] = [$state.params.slug];

        try{
          filters = angular.extend({}, initials.filters, $scope.filters);
        } catch(e){
          $log.warn('🔭 PublicationsCtrl sync() cannot parse filters correctly');
        }
      }
      if(initials.exclude){
        try{
          exclude = JSON.parse(initials.exclude);
        } catch(e){
          $log.warn('🔭 PublicationsCtrl sync() cannot parse filters correctly');
        }
      }

      $log.log('🔭 PublicationsCtrl sync()', $scope.state);

      // if its one of the "monographies", we get the publishable items associated. Optioanlly we can even deliver something
      if(RUNTIME.monographies.indexOf($scope.state) !== -1) {
        HallOfFames.push(TagFactory.hallOfFame({
          tag__filters: JSON.stringify({
            category: 'publishing'
          }),
          orderby: 'slug',
          filters: JSON.stringify(filters),
          exclude: JSON.stringify(exclude),
          limit: 100
        }, function(res){
          $scope.hallOfFame.publishings= {
            count: res.count,
            results: res.results
          }
        }, function(){
        }).$spromise);
      } else{
        delete $scope.hallOfFame.publishings
      }

      // add the hall of fame top authors promise to the queue
      HallOfFames.push(AuthorFactory.hallOfFame({
        filters: JSON.stringify(filters),
        exclude: JSON.stringify(exclude),
        limit: 10
      }, function(res){
        $scope.hallOfFame.topAuthors = {
          count: res.count,
          results: res.results
        }
      }).promise);



      $q.all(HallOfFames, function(){
        $log.log('🔭 PublicationsCtrl sync() $q.all() finished', $scope.state);
      });
      // chain of eventssyn

    }

    $scope.sync();
    $scope.$on(EVENTS.PARAMS_CHANGED, function(){
      $log.log('🔭 PublicationsCtrl @EVENTS.PARAMS_CHANGED');
      $scope.sync();
    });
  });
