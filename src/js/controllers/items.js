/**
 * @ngdoc function
 * @name miller.controller:coreCtrl
 * @description
 * # CoreCtrl
 * common functions go here.
 */
angular.module('miller')
  .controller('ItemsCtrl', function ($scope, $log, $filter, $state, initials, items, model, factory, description, QueryParamsService, extendItem, EVENTS) {
    $log.log('🌻 ItemsCtrl ready, n.:', items.count, '- items:',items, 'initials:', initials);

    // model is used to get the correct item template
      if(initials.orderby === "featured") {
          initials = {
              "orderby": "-date,-date_last_modified","limit":9,"description":"home-description",
              "filters": "{\"tags__slug__and\":[]}", "availableOrderby":initials.availableOrderby
          };
      }
      if(items === undefined || items.count === 0) {

      }
    $scope.model = model.split('.').shift();
    $scope.itemTemplate = model;
    $scope.nextParams = {};

    // local var used only for publicationsCtrl
    var _tag;
    if (description && $state.$current.params) {
      $scope.topDescription = description.contents
    }
    console.log("slug " + $state.params.slug);
      console.log("filters ");
      console.log(initials.filters)
    if($state.current.name == 'publications.tags')
      initials.filters['tags__slug__all'] = [$state.params.slug];
    else if (initials.filters) {
        console.log("Delete tags_slug-all");
        //delete initials.filters['tags__slug__all']
    }

    if($state.current.name == 'search.story') {
      $scope.setCount(items.count);
    }
    /*
      Get the firs n sentence until the number of words are covered.
      return an array
    */
    function tokenize(text, words){
      var sentences = text.split(/[\.!\?]/);
      // console.log(text, sentences);
      return sentences;
    }

    if($state.current.name != 'publications.tags') {
      if (typeof $scope.setTag == 'function')
        $scope.setTag(null);
    }

    function normalizeItems(items) {
      var md = new window.markdownit({
                  breaks:       true,
                  linkify:      true,
                  html: false
                })
                .disable([
                  'image',
                  'heading'
                ]);

      return items
        .map(function(d){
          if(!d.data || !d.data.abstract)
            return d

          d = extendItem(d, $scope.model, {
            language: $scope.language
          });

          if(!_tag && $state.current.name == 'publications.tags') {
            _tag = true;
            $scope.setTag(_.find(d.tags, {slug: $state.params.slug}));
          }

          // console.log(d)
          if(!d.data.abstract[$scope.language]){
            return d;
          }

          d.excerpt = md.renderInline($filter('tokenize')( d.data.abstract[$scope.language], 32));
          return d;
        })
    }

    // update scope vars related to count, missing, and render the items
    $scope.sync = function(res){
      $scope.isLoadingNextItems = false;
      // update next
      $scope.nextParams = QueryParamsService(res.next || '');
      $log.log('🌻 ItemsCtrl > sync() next:', $scope.nextParams);
      // update count
      $scope.count = res.count;
      // push items
      $scope.items = ($scope.items || []).concat(normalizeItems(res.results));
      // update missing
      $scope.missing = res.count - $scope.items.length;

      // TODO: Provisory fix for presentation, this need to be handled better
      $scope.showDescription = window.location.pathname === '/' && window.location.search === ''
    }

    $scope.more = function(){
      if($scope.isLoadingNextItems){
        $log.warn('🌻 is still loading');
        return;
      }
      $scope.isLoadingNextItems = true;

      factory($scope.nextParams, $scope.sync);
    }

    $scope.sync(items);

    // watch for ordering
    $scope.$on(EVENTS.PARAMS_CHANGED, function(e, newParams){
      if($scope.isLoadingNextItems){
        $log.warn('🌻 ItemsCtrl @EVENTS.PARAMS_CHANGED wait, is still loading');
        return;
      }
      $log.log('🌻 ItemsCtrl @EVENTS.PARAMS_CHANGED - params:', newParams);
      if(newParams.filters === undefined) {
          newParams = {
              "orderby": "-date,-date_last_modified",
              "filters": "{\"tags__slug__all\":[]}"
          };
      }
      $scope.isLoadingNextItems = true;

      // clean items
      $scope.items = [];

      // reset params to initial params, then add filters recursively
      var params = angular.copy(initials);

      for(var key in newParams){
        if(key == 'filters'){
          try {
            params.filters = JSON.stringify(angular.merge(params.filters, JSON.parse(newParams.filters)));
          } catch(e){
            $log.warn('🌻 ItemsCtrl @EVENTS.PARAMS_CHANGED wrong filters provided!');
            params.filters = initials.filters;
          }
        } else {
          params[key] = newParams[key]
        }
      }
      factory(params, $scope.sync);
    })
    // $scope.$watch('language', function(v){
    //   if(v){
    //     $scope.items =normalizeItems($scope.items);
    //   }
    // })

    /* Shopping cart */
    $scope.boxChecked = function (item) {
      if ($scope.cart.isItemSelected(item.id)) {
        $scope.cart.deselectItem(item);
      } else {
        $scope.cart.selectItem(item);
      }
    }

  });
