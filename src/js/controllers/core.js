/**
 * @ngdoc function
 * @name miller.controller:coreCtrl
 * @description
 * # CoreCtrl
 * common functions go here.
 */
angular.module('miller')
  .controller('CoreCtrl', function ($rootScope, $transitions, $scope, $log, $location, $window, $anchorScroll, $state, $modal, $alert, localStorageService, $filter, $translate, $timeout, StoryFactory, DocumentFactory, TagFactory, UserFactory, AuthorFactory, storyCart, RUNTIME, EVENTS) {
    $log.log('🍔 CoreCtrl ready, user:', RUNTIME.user.username, RUNTIME);

    $scope.user = $rootScope.user = RUNTIME.user;
    $scope.userGroups = _.map(RUNTIME.user.profile.groups, 'name');
    $scope.user.is_reviewer = $scope.userGroups.indexOf('reviewers') != -1;
    $scope.user.is_chief_reviewer = $scope.userGroups.indexOf('chief-reviewers') != -1;

    $scope.settings = RUNTIME.settings;

    $rootScope.page = 'author.publications.all';

    $scope.hasToC = false;
    $scope.ToCEnabled = false;

    $scope.stopStateChangeStart = false; // cfr toggleStopStateChangeStart below

    $scope.toggleTableOfContents = function (e) {
      $scope.hasToC = !$scope.hasToC;
      if (e)
        e.stopImmediatePropagation()
    };

    $scope.locationPath = '';

    $scope.activeTag = "";

    // toggle stopStateChangeStart variable thus affecting the StateChangeStart event
    $scope.toggleStopStateChangeStart = function (value) {
      $log.debug('🍔 CoreCtrl > toggleStopStateChangeStart value:', value, '- current:', $scope.stopStateChangeStart);
      $scope.stopStateChangeStart = typeof value == 'boolean' ? value : !$scope.stopStateChangeStart;
    };

    $scope.setToC = function (ToC) {
      $log.log('🍔 CoreCtrl > setToC data:', ToC);
      $scope.ToC = ToC;
      // $scope.ToCEnabled = false;
    };

    $scope.disableToC = function () {
      $scope.ToCDisabled = true;
    };

    $scope.search = function (searchquery) {
      $log.log('🍔 CoreCtrl > search() searchquery:', searchquery);

      $state.go('search.story', {
        q: searchquery
      });
    };

    // add document items to the table-of)documents
    $scope.setDocuments = function (documents) {
      $log.log('🍔 CoreCtrl > setDocuments items n.:', documents.length, documents);
      $scope.documents = _.uniq(documents, 'id');
      // if($scope.qs.view) {
      //   // check if it's somewhere in the scope, otherwise callit
      //   for(var i=0,j=$scope.documents.length;i<j;i++){
      //     if($scope.qs.view == $scope.documents[i].short_url){
      //       $scope.fullsized = $scope.documents[i];
      //       fullsizeModal.$promise.then(fullsizeModal.show);
      //       break;
      //     }
      //   }
      // }
    };
    $scope.$on(EVENTS.STORY_SET_DOCUMENTS, function (e, documents) {
      $log.log('🍔 CoreCtrl @EVENTS.STORY_SET_DOCUMENTS setDocuments documents n.:', documents.length);
      $scope.setDocuments(documents);
    });

    // look for document by slug (internal, cached docs or ask for new one)
    $rootScope.resolve = function (slug, type, callback) {
      if (type == 'voc') {
        $log.log('🍔 CoreCtrl > $scope.resolve [requesting] voc slug:', slug);
        StoryFactory.get({id: slug}, callback);
      } else {
        var matching = $scope.documents.filter(function (d) {
          return d.slug == slug;
        });
        if (matching.length) {
          $log.log('🍔 CoreCtrl > $scope.resolve [cached] doc slug:', slug);
          callback(matching[0]);
        } else {
          $log.log('🍔 CoreCtrl > $scope.resolve [requesting] doc slug:', slug);
          DocumentFactory.get({id: slug}, callback);
        }
      }
    };

    $scope.save = function () {
      $log.log('🍔 CoreCtrl > @SAVE ...');
      $scope.$broadcast(EVENTS.SAVE);
    };

    // filters and other stories.
    $scope.params = {};
    $scope.filters = {};

    $scope.changeOrderby = function (orderby) {
      $log.log('🍔 CoreCtrl > @changeOrderby ...');
      $location.search('orderby', orderby);

    }

    var setNewLocation = function () {
      // Avoid to keep the "featured" orderby
      var params = $location.search()
      // debugger
      if (!('orderby' in params) || !params.orderby || params.orderby === 'featured') {
        params.orderby = '-date,-date_last_modified';
        params.filters = JSON.stringify($scope.filters);
        $location.search(params);
      } else {
        $location.search('filters', !angular.equals({}, $scope.filters) ? JSON.stringify($scope.filters) : null);
      }
    }

    $scope.toggleFilter = function (key, value) {
      $log.log('🍔 CoreCtrl > @setFilters ...');
      // only if it is the same as the current value
      if ($scope.filters[key] == value) {
        delete $scope.filters[key];
      } else {
        $scope.filters[key] = value;
      }
      // empty filters?
      setNewLocation()
    }

    $scope.selectTag = function (tag, filterType) {
      /*
      * tag: itme to filter with
      * filterType: name of the filter, default is tags__slug__and
      * This function handle lists filter (like __in, ___and, ...).
      * */
      if (filterType === undefined) {
        filterType = 'tags__slug__and'
      }

      // if (!(filterType in $scope.filters)) {
      //   $scope.filters[filterType] = [];
      // }
        $scope.filters[filterType] = [];
        if(tag != "all") {
            $scope.filters[filterType].push(tag);
        }

      // if ($scope.filters[filterType].indexOf(tag) !== -1) {
      //   $scope.filters[filterType].splice($scope.filters[filterType].indexOf(tag), 1);
      //   if ($scope.filters[filterType].length === 0) {
      //     delete $scope.filters[filterType]
      //   }
      // } else {
      //     $scope.filters[filterType] = [];
      //   $scope.filters[filterType].push(tag);
      // }

        $scope.activeTag = tag;
      setNewLocation()
    }

    $scope.selectSingleTag = function (tag, filterType) {
      /*
      * tag: item to filter with
      * filterType: name of the filter
      * This function handle single value filters (like status, ...).
      * This function can be overriden in scope to modify its default way to operate (exemple in AssignCtrl)
      * */
      if (filterType === undefined) {
        return
      }

      if (filterType in $scope.filters && $scope.filters[filterType] === tag) {
        delete $scope.filters[filterType]
      } else {
        $scope.filters[filterType] = tag
      }
      setNewLocation()
    }

    $scope.isTagActive = function (tag) {
      /*
      * Default way to define if a tag is selected or not
      * This function can be overriden in scope to modify its default way to operate
      * */
      return $scope.filters.tags__slug__and && $scope.filters.tags__slug__and.findIndex(function (e) {
        return e === tag;
      }) !== -1;
    }

    $scope.getActiveTag = function () {
        return $scope.activeTag;
    }

    $scope.isSDGActive = function (tag) {
      /*
      * Default way to define if a tag is selected or not
      * This function can be overriden in scope to modify its default way to operate
      * */
      return !$scope.filters.tags__slug__and || ($scope.filters.tags__slug__and && $scope.filters.tags__slug__and.findIndex(function (e) {
        return e === tag;
      }) !== -1);
    }

    $scope.isNoFilter = function() {
        console.log($scope.filters);
        return $scope.filters["tags__slug__and"] === undefined || $scope.filters["tags__slug__and"].length === 0;
    }

    $scope.download = function () {
      $log.log('🍔 CoreCtrl > @DOWNLOAD ...');
      $scope.$broadcast(EVENTS.DOWNLOAD);
    };

    $scope.update = function (key, value) {
      $log.log('🍔 CoreCtrl > @UPDATE ', key, ':', value, ' ...');
      var _d = {};
      _d[key] = value;
      $scope.$broadcast(EVENTS.UPDATE, _d);
    };


    $scope.lock = function () {
      $scope.locked = true;
      $log.log('🍔 CoreCtrl > lock .............');
    };

    $scope.unlock = function (msg) {
      $scope.locked = false;
      $log.log('🍔 CoreCtrl > unlock ............. message:', msg);
    };

    /*
      Suggest tags for writing purposes
    */
    $scope.suggestTags = function (query, options, has_create) {
      $log.log('🍔 CoreCtrl -> suggestTags', query, options);
      var filters = options || {},
          // request params
          params  = {
            filters: JSON.stringify(filters),
            limit: 999
          };

      if (query.trim().length > 2) {
        params.q = query
      }

      // filters.name__icontains = query;
      return TagFactory.get(params).$promise.then(function (response) {
        console.log(response.results)
        return !has_create ? response.results : response.results.concat([{
          type: '__new__',
          name: 'createnew',
          id: 'createnew',
          query: query
        }]);
      });
    };

    /*

    */
    /*
      Set breaking news above the header.
      Cfr indexCtrl
    */
    $transitions.onStart({}, function ($transition$) {
      var from = $transition$.$from().name
      var to = $transition$.$to().name;

      $log.log('🍔 CoreCtrl @stateChangeStart new:', to, '- previous:', $scope.state);
      if (to === 'login' && $scope.user.short_url) {
        $log.warn('... cannot switch to login, user already logged in:', $scope.user.username);

        if ($scope.state && $scope.state != 'login')
          $state.go($scope.state);
        else
          $state.go('author.publications.all');

        return;
      }

      if ($scope.stopStateChangeStart === true && from.split('.')[0] !== to.split('.')[0]) {
        // check the user has wirtten sometihing..
        var answer = confirm("Are you sure you want to leave this page?");
        if (!answer) {
          return false;
        }
      }
    });

    $transitions.onSuccess({}, function ($transition$) {
      // Transition is triggered when the hash change. Block transition if only the hash change
      var updatedParams = $transition$.paramsChanged();
      if (Object.keys(updatedParams).length === 1 && Object.keys(updatedParams)[0] === '#' && updatedParams['#'] !== null) {
        return;
      }

      var h = $location.hash();

      // clean
      $scope.ToC = [];
      $scope.documents = [];

      // the ui.router state (cfr app.js)
      $scope.state = $transition$.$to().name;

      $scope.previousState = {
        from: $transition$.$from(),
        fromParams: $transition$.$from().params
      };

      $rootScope.page = _.compact($scope.state
        .split('.')
        .filter(function (d) {
          return ['page', 'all', 'story'].indexOf(d) == -1;
        }).concat([
          $state.params.name,
          $state.params.storyId,
          $state.params.postId
        ])).join(' - ');

      $scope.absoluteUrl = $rootScope.absoluteUrl = $state.href($state.current.name, $state.params, {
        absolute: true
      });

      $log.debug('🍔 CoreCtrl @stateChangeSuccess - name:', $scope.state, '- page:', $rootScope.page);

      if (h && h.length)
        $timeout($anchorScroll, 0); // wait for the next digest cycle (cfr marked directive)

      // toggle stopChanceStart if the state is among the blocking ones
      $scope.toggleStopStateChangeStart(false);

      // google analytics
      $window.ga('send', 'pageview', $location.path());
      window.scrollTo(0, 0);
    });

    $rootScope.getTagRoute = function (tag) {
      return '/?orderby=-date,-date_last_modified&filters={"tags__slug__and":["' + tag.slug + '"]}';
    }

    $rootScope.getBlogRoute = function (tag) {
      return '/blog?orderby=-date,-date_last_modified&filters={"tags__slug":"' + tag.slug + '"}';
    }

    $scope.setHash = function (hash) {
      $location.hash(hash);
    };

    $scope.changeLanguage = function (key) {
      $scope.language = key;
      $rootScope.language = key;
      localStorageService.set('lang', $scope.language);
      $log.log('🍔 CoreCtrl -> changeLanguage language:', $scope.language)
      $translate.use(key);
      $scope.$broadcast(EVENTS.LANGUAGE_CHANGED, $scope.language)
    };

    $scope.isWithoutAuthors = function (story) {
      return story.authors.length !== 0;
    };

    /*
      Check that the user is allowed to write contents for the given story
      (enforced on server side of course)
    */
    $scope.hasWritingPermission = function (user, story) {
      return !!user.username &&
        user.username.length > 0 &&
        (user.is_staff || story.owner.username == user.username || _.map(story.authors, 'profile.user.username').indexOf(user.username) !== -1);
    };

    /*
      When requested, fullsize for documents.
      Cfr also locationChangeSuccess listener
    */
    var fullsizeModal = $modal({
      scope: $scope,
      template: RUNTIME.static + 'templates/partials/modals/fullsize.html',
      id: 'dii',
      show: false
    });

    $scope.$on('modal.hide', function (e, modal) {
      // if(modal.$id== 'dii')
      //   $location.search('view', null);
      $scope.fullsized = null;
    });

    //
    $rootScope.fullsize = function (slug, type) {
      $log.log('🍔 CoreCtrl -> fullsize -slug:', slug, '-type:', type);

      if (type == 'voc') {
        $state.go('story', {
          postId: slug
        })
      } else {
        // go to fullpage view for document
        // $location.search('view', slug);
        var _isCached = false;
        // check if it's somewhere in the scope, otherwise callit
        for (var i = 0, j = $scope.documents.length; i < j; i++) {
          if (slug == $scope.documents[i].slug) {
            $scope.fullsized = $scope.documents[i];
            fullsizeModal.$promise.then(fullsizeModal.show);
            _isCached = true
            break;
          }
        }
        if (!_isCached) {
          $log.log('🍔 CoreCtrl -> fullsize, doc slug:', slug, 'not found in documents, loading...');
          DocumentFactory.get({id: slug}, function (res) {
            $scope.fullsized = res;
            fullsizeModal.$promise.then(fullsizeModal.show);
          });
        }

        // if($scope.qs.view){
        //

      }
      // $scope.fullsized = doc;
      // $location.search('view', doc.short_url);
    };

    /*
      Select an user, staff only feature.
    */
    $scope.suggestUser = function (query, options) {
      if (!$scope.user.is_staff) {
        $log.warn('🍔 CoreCtrl -> suggestUser is avaialble to staff only, you should not be here.');
      }
      $log.log('🍔 CoreCtrl -> suggestUser', query, options);
      var filters = options || {};
      return UserFactory.get({
        filters: JSON.stringify(filters)
      }).$promise.then(function (response) {
        return response.results;
      });
    };

    /*
      Prevent from closing
    */
    window.onbeforeunload = function (event) {
      if ($scope.state && ['draft', 'writing'].indexOf($scope.state) !== -1) {
        var message = 'Sure you want to leave?';
        if (typeof event == 'undefined') {
          event = window.event;
        }
        if (event) {
          event.returnValue = message;
        }
        return message;
      }
    };


    /*
      Seo open graph for facebook and other social media
      Verify that OG are present for every route.
      E.g of input
      {
        type: "article",
        title: "When Great Minds Don’t Think Alike",
        description: "How much does culture influence creative thinking?"
        image: "http://static01.nyt.com/images/2015/02/19/arts/international/19iht-btnumbers19A/19iht-btnumbers19A-facebookJumbo-v2.jpg"
      }

      E.g. of output in html page:
      <meta property="og:url"                content="http://www.nytimes.com/2015/02/19/arts/international/when-great-minds-dont-think-alike.html" />
      <meta property="og:type"               content="article" />
      <meta property="og:title"              content="When Great Minds Don’t Think Alike" />
      <meta property="og:description"        content="How much does culture influence creative thinking?" />
      <meta property="og:image"              content="http://static01.nyt.com/images/2015/02/19/arts/international/19iht-btnumbers19A/19iht-btnumbers19A-facebookJumbo-v2.jpg" />

      There is no need to add the og:url, miller uses the current route with all params.
      @param OG is a dictionary of openGraph metadata ({key: "value"})
    */
    $scope.setOG = function (OG) {
      $log.debug('CoreCtrl -> setOG', OG);
      $rootScope.OG = angular.extend({
        title: '',
        description: '',
        image: '',
      }, OG || {});
    };

    /*
      On location change, collect the parameters.
      Since this is called BEFORE statehangeSuccess, the scrolling cannot be made at this level.
    */
    $scope.$on('$locationChangeSuccess', function (e, path) {
      $log.debug('🍔 CoreCtrl @locationChangeSuccess', path, $location);
      $scope.qs = $location.search();
      // addd filters
      try {
        $scope.filters = $scope.qs.filters ? JSON.parse($scope.qs.filters) : {"tags__slug__and":[]};
        $log.log("🍔 CoreCtrl load filters: ", $scope.filters);

      } catch (ex) {
        $log.warn("🍔 CoreCtrl couldn't load filters", ex);
        $scope.filters = {};
      }

      $scope.locationPath = path;
      $scope.path = $location.path();
      $scope.searchquery = $scope.qs.q;
      // // load fullsize
      // if($scope.qs.view){
      //   DocumentFactory.get({id: $scope.qs.view}, function(res){
      //     $scope.fullsized = res;
      //     fullsizeModal.$promise.then(fullsizeModal.show);
      //   });
      // }
      if ($scope.fullsized) {
        $scope.fullsized = null;
        fullsizeModal.hide();
      }
      // if($scope.qs.view && $scope.fullsized && $scope.fullsized.short_url == $scope.qs.view){
      //   // normal behaviour, after fullsize has been called the view param is present in location
      //   fullsizeModal.$promise.then(fullsizeModal.show);
      // } else if(!$scope.qs.view && $scope.fullsized){
      //    fullsizeModal.hide();
      // }

      /*
        Now emit stuff
      */
      $scope.$broadcast(EVENTS.PARAMS_CHANGED, $scope.qs);
    });

    $scope.setLocationFilter = function (field, value) {
      $location.search(field, value);
    };

    $scope.removeLocationFilter = function (field) {
      $location.search(field, null);
    };

    // also done on resize. Store the
    $scope.calculateBounds = function (event) {
      $rootScope.isASmallScreen = $window.innerWidth < 992;
    }

    // watch 400 bad request form error. Cfr app.js interceptors.
    $rootScope.$on(EVENTS.BAD_REQUEST, function (e, rejection) {
      $log.warn('@BAD_REQUEST.')
      if (rejection.status == 400)
        $alert({
          placement: 'top',
          title: 'form errors',
          'animation': 'bounceIn',
          content: _(rejection.data).map(function (d, k) {
            return '<div><b>' + k + '</b>: ' + d + '</div>';
          }).value().join(''),
          show: true,
          type: 'error'
        });
    });

    $rootScope.$on(EVENTS.PERMISSION_DENIED, function (e, rejection) {
      $log.warn('@PERMISSION_DENIED. Should redirect', $location.absUrl());
      // window.location.href = '/login/?next='+$location.path();
    });

    var timer_event_message;
    // watch for saving or MESSAGE events
    $scope.messageError = false;
    var makeMessage = function (e, message, popuptime) {
      $log.log('🍔 CoreCtrl @MESSAGE', message);
      $scope.message = message;
      if (timer_event_message)
        $timeout.cancel(timer_event_message);
      timer_event_message = $timeout(function () {
        $scope.message = null;
      }, popuptime);
    }
    $scope.$on(EVENTS.MESSAGE, function (e, message) {
      $scope.messageError = false;
      makeMessage(e, message, 4000)
    });
    $scope.$on(EVENTS.ERROR, function (e, message) {
      $scope.messageError = true;
      makeMessage(e, message, 4000)
    });


    /*
      CTRL + S listener
    */
    angular.element($window).bind("keydown", function(event) {
      if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
            event.preventDefault();
            $scope.save();
            break;
        }
      }

    })

    angular.element($window).bind("resize", $scope.calculateBounds)
    /*
      First load
    */
    // load language
    $scope.language = localStorageService.get('lang') || 'en_US';
    $scope.changeLanguage($scope.language);

    // understand window size;
    $scope.calculateBounds();

    $rootScope.cart = storyCart;
    var downloadCartModal = $modal({
      scope: $rootScope,
      controller: function($rootScope) {
        $rootScope.downloadUrl = '';

        $rootScope.setUrl = function () {
          if (!$rootScope.cart.selectedItems.length) {
            $rootScope.downloadUrl = ''
          }
          else if ($rootScope.cart.selectedItems.length === 1) {
            $rootScope.downloadUrl = '/api/story/' + $rootScope.cart.selectedItems[0].id + '/download'
          }
          else {
            var selectedIds = $rootScope.cart.selectedItems.map(function (item) {
              return item.id
            })
            $rootScope.downloadUrl = '/api/story/' + selectedIds.join(',') + '/download/many'
          }
        }
        $rootScope.setUrl();
      },
      template: RUNTIME.static + 'templates/partials/modals/download-cart.html',
      id: 'download-cart-modal',
      show: false
    })

    $rootScope.openDownloadCartModal = function () {
      downloadCartModal.$promise.then(function () {
        downloadCartModal.show();
      });
    }
  });