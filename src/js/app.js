/**
 * @ngdoc overview
 * @name miller
 * @description
 * # miller
 *
 * Main module of the application.
 */
angular
  .module('miller', [
    'ui.router',
    // 'ngAnimate',
    'ngResource',
    'ngSanitize',
    'ngCookies',
    'ngTagsInput',
    'mgcrea.ngStrap',
    'monospaced.elastic',
    'LocalStorageModule',
    'pascalprecht.translate',
    // 'angular-embedly',
    // 'ngDisqus',
    // 'angular-embed',
    // 'angular-embed.handlers',
    'angularLoad',
    'angularLazyImg',
    'ngFileUpload',
    '720kb.socialshare'
  ])
  .constant('LOCALES', {
    'locales': {
      'en_US': 'English'
    },
    'preferredLocale': 'en_US'
  })
  .constant('EVENTS', {
    'SAVE': 'save',
    'PARAMS_CHANGED':'params_changed',
    'DOWNLOAD': 'download',
    'MESSAGE': 'message',
    'ERROR': 'error',
    'BAD_REQUEST':'bad_request',
    'PERMISSION_DENIED':'permission_denied',
    'RESIZED': 'resized',
    // namespace for markdownit directive
    'MARKDOWNIT_FULLSIZE': 'markdownit_fullsize',
    'MARKDOWNIT_RESOLVE': 'markdownit_resolve',
    'MARKDOWNIT_FOCUS': 'markdownit_focus',

    'STORY_SET_DOCUMENTS': 'story_set_documents',
    'SOCKET_USER_COMMENTED_STORY': 'socket_user_commented_story',
    'SOCKET_USER_UNCOMMENTED_STORY': 'socket_user_uncommented_story',

    'RANGY_FOCUS': 'rangy_focus',
    'RANGY_REFRESH': 'rangy_refresh',

    'LANGUAGE_CHANGED': 'language_changed'
  })
  /*
    disqus configuration
  */
  // .config(function($disqusProvider, RUNTIME) {
  //   if(RUNTIME.settings.disqus){
  //     $disqusProvider.setShortname(RUNTIME.settings.disqus);
  //   }

  // })
  /*
    debug enabled
  */
  .config(function($logProvider, RUNTIME) {
    console.log('ENABLE DEBUG:', !!RUNTIME.settings.debug);
    $logProvider.debugEnabled(!!RUNTIME.settings.debug);
  })

  /*
    prefix
  */
  .config(function($locationProvider) {
    $locationProvider.hashPrefix('!');
  })
  /*
    multiple input tags configuration
  */
  .config(function(tagsInputConfigProvider, RUNTIME) {
    tagsInputConfigProvider
    .setDefaults('tagsInput', {
      replaceSpacesWithDashes:false,
      template: RUNTIME.static + 'templates/partials/tag.input.html'
    })
    .setDefaults('autoComplete', {
      loadOnDownArrow: true
    });
  })
  /*
    LazyImg config
    cfr
  */
  .config(function(lazyImgConfigProvider) {
    lazyImgConfigProvider.setOptions({
      offset: 200, // how early you want to load image (default = 100)
      errorClass: 'error', // in case of loading image failure what class should be added (default = null)
      successClass: 'loaded', // in case of loading image success what class should be added (default = null)
    })
  })
  /*
    Angular-translate configs
    Cfr. https://scotch.io/tutorials/internationalization-of-angularjs-applications
  */
  .config(function ($translateProvider, RUNTIME) {
    // $translateProvider.useMissingTranslationHandlerLog();
    $translateProvider.useSanitizeValueStrategy(null)
    $translateProvider.useStaticFilesLoader({
        prefix: RUNTIME.static + 'locale/locale-',// path to translations files
        suffix: '.json'// suffix, currently- extension of the translations
    });
    $translateProvider.preferredLanguage('en_US');// is applied on first load

  })
  .config(function (localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('miller');
  })
  .config(function($resourceProvider) {
    $resourceProvider.defaults.stripTrailingSlashes = false;
  })
  .config(function($httpProvider) {
    // $httpProvider.defaults.xsrfCookieName = 'Miller';
    // $httpProvider.defaults.xsrfHeaderName = 'HTTP_X_CSFRTOKEN';
    $httpProvider.defaults.xsrfCookieName = 'Miller';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    // intercept BAD request errors
    $httpProvider.interceptors.push(function($q, $rootScope, EVENTS) {
      return {
        responseError: function(rejection) {
          // emit on 400 error (bad request, mostly form errors)
          if(rejection.status == 400){
            $rootScope.$emit(EVENTS.BAD_REQUEST, rejection);
          } else if(rejection.status == 403){
            $rootScope.$emit(EVENTS.PERMISSION_DENIED, rejection);
          }
          return $q.reject(rejection);
        }
      };
    });
  })
  .config(function($locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false,
      rewriteLinks: false
    });
    // $locationProvider.hashPrefix('!');
  })
  // .config(function(embedlyServiceProvider, RUNTIME) {
  //   if(RUNTIME.oembeds.EMBEDLY_API_KEY)
  //     embedlyServiceProvider.setKey(RUNTIME.oembeds.EMBEDLY_API_KEY);
  // })
  .config(function ($stateProvider, $urlRouterProvider, RUNTIME) {
    // $urlRouterProvider.config({
    //   absolute: true
    // })
    $urlRouterProvider
      .otherwise("/");

    $stateProvider
      .state('index.signup', {
        url: '/',
        reloadOnSearch : false,
        controller: 'SignupCtrl',
        templateUrl: RUNTIME.static + 'templates/signup.html'
      })
      .state('map', {
        url: '/map',
        reloadOnSearch : false,
        templateUrl: RUNTIME.static + 'templates/map-overview.html'
      })
      .state('draft', {
        url: '/create',
        reloadOnSearch : false,
        controller: 'DraftCtrl',
        templateUrl: RUNTIME.static + 'templates/draft.html'
      })
      .state('upload', {
        url: '/upload',
        reloadOnSearch : false,
        controller: 'UploadCtrl',
        templateUrl: RUNTIME.static + 'templates/upload.html'
      })
      .state('uploaded', {
        url: '/uploaded/:storyId',
        reloadOnSearch : false,
        controller: 'UploadedCtrl',
        templateUrl: RUNTIME.static + 'templates/uploaded.html',
        resolve: {
          story: function(StoryFactory, $stateParams) {
            return StoryFactory.get({id: $stateParams.storyId}).$promise;
          },
        }
      })
      .state('writing', {
        url: '/writing/:storyId?collection',
        reloadOnSearch : false,
        controller: 'WritingCtrl',
        templateUrl: RUNTIME.static + 'templates/writings.html',
        resolve: {
          story: function(StoryFactory, $stateParams) {
            return StoryFactory.get({id: $stateParams.storyId, nocache: true}).$promise;
          },
        }
      })
        .state('writing.live', {
          url: '/live',
          reloadOnSearch : false,
          templateUrl: RUNTIME.static + 'templates/writings.live.html'
        })
        .state('writing.compare', {
          url: '/compare/:tag',
          reloadOnSearch : false,
          controller: function($scope, version){
            $scope.version = version;
          },
          templateUrl: RUNTIME.static + 'templates/writings.compare.html',
          resolve: {
            version: function(StoryGitFactory, $stateParams) {
              return StoryGitFactory.getByGitTag({
                id: $stateParams.storyId,
                commit: $stateParams.tag,
              }).$promise;
            },
          }
        })
          .state('writing.compare.diff', {
            url: '/diff',
            reloadOnSearch : false,
            controller: function($scope, diff, story, StoryGitFactory, $stateParams){
              $scope.diff = diff.results.diff;
              // original story
              $scope.hash = story.version;

              $scope.$watch('story', function(v){

                if(v.version && v.version != $scope.hash) {
                  StoryGitFactory.getDiff({
                    id: $stateParams.storyId,
                    commit: $stateParams.tag,
                  }, function(res){
                    $scope.diff = res.results.diff;
                  })
                }
                //

              }, true)
            },
            templateUrl: RUNTIME.static + 'templates/writings.compare.diff.html',
            resolve: {
              diff: function(StoryGitFactory, $stateParams) {
                return StoryGitFactory.getDiff({
                  id: $stateParams.storyId,
                  commit: $stateParams.tag,
                }).$promise;
              },
            }
          })
          .state('writing.compare.preview', {
            url: '/preview',
            reloadOnSearch : false,
            templateUrl: RUNTIME.static + 'templates/writings.compare.preview.html'
          })
    /*

      Author routes.

    */
    $stateProvider
      .state('author', {
        abstract: true,
        reloadOnSearch : false,
        url: '/author/{slug:[0-9a-zA-Z\\.\\-_]+}',
        controller: 'AuthorCtrl',
        templateUrl: RUNTIME.static + 'templates/author.html',
        resolve: {
          author: function(AuthorFactory, $stateParams){
            return AuthorFactory.get({
              slug: $stateParams.slug
            }).$promise;
          }
        }
      })

      .state('author.publications', {
        url: '/publications',
        abstract:true,
        reloadOnSearch : false,
        controller: function($scope){
          $scope.urls = RUNTIME.stories;
        },
        templateUrl: RUNTIME.static + 'templates/author.publications.html',
      })
      .state('author.publications.drafts', {
        url: '/drafts',
        reloadOnSearch : false,
        controller: 'ItemsCtrl',
        templateUrl: RUNTIME.static + 'templates/items.html',
        resolve: {
          initials: function(author) {
            return {
              filters: {
                status: 'draft',
                authors__slug: author.slug
              },
              orderby: '-date,-date_last_modified'
            }
          },
          items: function(StoryFactory, initials) {
            return StoryFactory.get(initials).$promise;
          },
          model: function() {
            return 'story';
          },
          factory: function(StoryFactory) {
            return StoryFactory.get;
          },
          description: function (PageFactory, initials) {
            if (initials.description) {
              return PageFactory.get({name: initials.description}).$promise;
            } else {
              return null;
            }
          }
        }
      })
      .state('author.publications.bin', {
        url: '/bin',
        reloadOnSearch : false,
        controller: 'ItemsCtrl',
        templateUrl: RUNTIME.static + 'templates/items.html',
        resolve: {
          initials: function(author) {
            return {
              filters: {
                status: 'deleted',
                authors__slug: author.slug
              },
              orderby: '-date,-date_last_modified'
            }
          },
          items: function(StoryFactory, initials) {
            return StoryFactory.get(initials).$promise;
          },
          model: function() {
            return 'story';
          },
          factory: function(StoryFactory) {
            return StoryFactory.get;
          },
          description: function (PageFactory, initials) {
            if (initials.description) {
              return PageFactory.get({name: initials.description}).$promise;
            } else {
              return null;
            }
          }
        }
      })
      .state('author.publications.all', {
        url: '/',
        reloadOnSearch : false,
        controller: 'ItemsCtrl',
        templateUrl: RUNTIME.static + 'templates/items.html',
        resolve: {
          initials: function(author) {
            return {
              filters: {
                authors__slug: author.slug
              },
              orderby: '-date,-date_last_modified'
            }
          },
          items: function(StoryFactory, initials) {
            return StoryFactory.get(initials).$promise;
          },

          model: function() {
            return 'story';
          },
          factory: function(StoryFactory) {
            return StoryFactory.get;
          },
          description: function (PageFactory, initials) {
            if (initials.description) {
              return PageFactory.get({name: initials.description}).$promise;
            } else {
              return null;
            }
          }
        }
      });

      _.each(RUNTIME.routes.publications.writing.concat(RUNTIME.routes.publications.tags), function(d){
        $stateProvider
          .state('author.publications.' + d.slug, {
            url: d.url,
            controller: 'ItemsCtrl',
            templateUrl: RUNTIME.static + 'templates/items.html',
            resolve: {
              initials: function(author) {
                return {
                  filters: d.slug? {
                    tags__category__in: ['writing', 'blog'],
                    tags__slug: d.slug,
                    authors__slug: author.slug
                  }: {
                    tags__category__in: ['writing', 'blog'],
                    authors__slug: author.slug
                  },
                  limit: 10,
                  orderby: '-date,-date_last_modified'
                }
              },
              items: function(StoryFactory, initials) {
                return StoryFactory.get(initials).$promise;
              },
              model: function() {
                return 'story';
              },
              factory: function(StoryFactory) {
                return StoryFactory.get;
              },
              description: function (PageFactory, initials) {
                if (initials.description) {
                  return PageFactory.get({name: initials.description}).$promise;
                } else {
                  return null;
                }
              }
            }
          });
      });

    $stateProvider
      .state('modifyauthor', {
        url: '/author/{slug:[0-9a-zA-Z\\.\\-_]+}/edit',
        controller: 'AuthorEditCtrl',
        templateUrl: RUNTIME.static + 'templates/author.edit.html',
        resolve: {
          author: function(AuthorFactory, $stateParams){
            return AuthorFactory.get({
              slug: $stateParams.slug
            }).$promise;
          }
        }
      });

    /*
      Profile. One profile per user, that's easier.
    */
    $stateProvider
      .state('profile', {
        // abstract: true,
        url: '/profile/{username:[0-9a-zA-Z\\.\\-_]+}',
        controller: 'ProfileCtrl',
        templateUrl: RUNTIME.static + 'templates/profile.html',
        reloadOnSearch : false,
        resolve: {
          profile: function(ProfileFactory, $stateParams){
            return ProfileFactory.get({
              username: $stateParams.username
            }).$promise;
          },
          authors: function(ProfileFactory, $stateParams){
            return ProfileFactory.authors({
              username: $stateParams.username
            }).$promise;
          },
        }
      })
        .state('profile.publications', {
          url: '/publications',
          reloadOnSearch : false,
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function(profile){
              return {
                filters: {
                  authors__user__username: profile.username
                },
                orderby: '-date,-date_last_modified'
              }
            },
            items: function(StoryFactory, initials) {
              return StoryFactory.get(initials).$promise;
            },
            model: function() {
              return 'story';
            },
            factory: function(StoryFactory) {
              return StoryFactory.get;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });

    $stateProvider
      .state('assign', {
        abstract: true,
        url: '/assign',
        controller: 'AssignCtrl',
        templateUrl: RUNTIME.static + 'templates/listofitems.html',
        reloadOnSearch : false,
      });

    _.each(RUNTIME.routes.assign, function(d){
      $stateProvider
        .state('assign.' + d.slug, {
          url: d.url,
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function(){

              return {
                filters: {
                  status__in: d.slug == 'all'? ['pending', 'review', 'editing', 'reviewdone']: [d.slug]
                },
                orderby: '-date_last_modified'
              };
            },
            items: function(StoryFactory, djangoFiltersService, initials) {
              return StoryFactory.pending(djangoFiltersService(initials)).$promise;
            },

            model: function() {
              return 'story.pending';
            },
            factory: function(StoryFactory) {
              return StoryFactory.pending;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });
    });


    $stateProvider
      .state('reviews', {
        abstract: true,
        url: '/reviews',
        controller: 'ReviewsCtrl',
        templateUrl: RUNTIME.static + 'templates/listofitems.html',
        reloadOnSearch : false,
      });
    _.each(RUNTIME.routes.reviews, function(d){
      $stateProvider
        .state('reviews.' + d.slug, {
          url: d.url,
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function(){

              return {
                filters: d.filters || {},
                orderby: '-date_last_modified'
              };
            },
            items: function(ReviewFactory, djangoFiltersService, initials) {
              return ReviewFactory.get(djangoFiltersService(initials)).$promise;
            },

            model: function() {
              return 'review';
            },
            factory: function(ReviewFactory) {
              return ReviewFactory.get;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });
      });

    $stateProvider
      .state('reviews.reports', {
        url: '/reports',
        controller: 'ItemsCtrl',
        templateUrl: RUNTIME.static + 'templates/items.html',
        resolve: {
          initials: function() {

            return {}
          },
          items: function(ReviewFactory) {
            return ReviewFactory.reports(initials).$promise;
          },
          model: function() {
            return 'report';
          },
          factory: function(ReviewFactory) { // get items
            return ReviewFactory.reports;
          },
          description: function (PageFactory, initials) {
            if (initials.description) {
              return PageFactory.get({name: initials.description}).$promise;
            } else {
              return null;
            }
          }
        }
      });

    $stateProvider
      .state('review', {
        url: '/review/{id:[0-9]+}',
        controller: 'ReviewCtrl',
        templateUrl: RUNTIME.static + 'templates/review.html',
        resolve: {
          review: function(ReviewFactory, $stateParams) {
            return ReviewFactory.get({
              id: $stateParams.id
            }).$promise;
          }
        }
      })
      .state('review.story', {
        url: '/story',
        controller: 'StoryCtrl',
        templateUrl: RUNTIME.static + 'templates/story.html',
        resolve: {
          story: function(review) {
            return review.story;
          },
        }
      });
    // report of review.
    $stateProvider
      .state('report', {
        url: '/report/{id:[0-9]+}',
        controller: 'ReviewCtrl',
        templateUrl: RUNTIME.static + 'templates/review.html',
        resolve: {
          review: function(ReviewFactory, $stateParams) {
            return ReviewFactory.report({
              id: $stateParams.id
            }).$promise;
          }
        }
      })

    $stateProvider
      .state('blog', {
        url: '/blog',
        reloadOnSearch : false,
        abstract:true,
        controller: 'BlogCtrl',
        templateUrl: RUNTIME.static + 'templates/listofitems.html',

      })
     _.each(RUNTIME.routes.blog, function(d){
      $stateProvider
        .state('blog.' + d.slug, {
          url: d.url,
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function($location){
              var filters = d.slug !== 'all'? {tags__slug: d.slug } : {tags__category: 'blog'}
              var paramFilters = {}

              if ($location.$$search && $location.$$search.filters) {
                paramFilters = JSON.parse($location.$$search.filters)
              }

              return {
                filters: angular.extend({}, filters, paramFilters),
                orderby: '-date,-date_last_modified'
              }
            },
            items: function(StoryFactory, initials) {
            return StoryFactory.get(initials).$promise;
            },
            model: function() {
              return 'story';
            },
            factory: function(StoryFactory) {
              return StoryFactory.get;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });
    });


    $stateProvider
      .state('authors', {
        url: '/authors',
        reloadOnSearch : false,
        abstract:true,
        controller: 'AuthorsCtrl',
        templateUrl: RUNTIME.static + 'templates/listofitems.html',
      })


      _.each([{
        slug: 'all',
        url: ''
      }].concat(RUNTIME.routes.authors.tags, RUNTIME.routes.authors.writing), function(d){
        $stateProvider
          .state('authors.' + d.slug, {
            url: d.url,
            controller: 'ItemsCtrl',
            templateUrl: RUNTIME.static + 'templates/items.html',
            resolve: {
              initials: function(){

                return {
                  filters: d.filters? d.filters: {},
                  exclude: {
                    data__num_stories: 0
                  },
                  limit: 20,
                  orderby: 'data__lastname'
                }
              },
              items: function(AuthorFactory, djangoFiltersService, initials) {
                return AuthorFactory.get(djangoFiltersService(initials)).$promise;
              },
              model: function() {
                return 'author.item';
              },
              factory: function(AuthorFactory) {
                return AuthorFactory.get;
              },
              description: function (PageFactory, initials) {
                if (initials.description) {
                  return PageFactory.get({name: initials.description}).$promise;
                } else {
                  return null;
                }
              }
            }
          });
      });
    /*
      Kind of story:writings publications
    */
    $stateProvider
      .state('publications', {
        url: '/',
        abstract: true,
        reloadOnSearch : false,
        controller: 'PublicationsCtrl',
        templateUrl: RUNTIME.static + 'templates/listofitems.html'
      })
        .state('publications.tags', {
          url: '/tags/:slug',
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function() {
              return {
                filters: {
                  tags__category: 'writing'
                },
                limit: 9,
                orderby: '-date,-date_last_modified'
              };
            },
            items: function(StoryFactory, $stateParams, djangoFiltersService, initials) {
              console.log($stateParams.slug)
              initials.filters['tags__slug__all'] = [$stateParams.slug];
              return StoryFactory.get(djangoFiltersService(initials)).$promise;
            },

            model: function() {
              return 'story';
            },
            factory: function(StoryFactory) {
              return StoryFactory.get;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });

      _.each(RUNTIME.routes.publications.all.concat(RUNTIME.routes.publications.status), function(d) {
        $stateProvider
          .state('publications.' + d.slug, {
            url: d.url,
            controller: 'ItemsCtrl',
            templateUrl: RUNTIME.static + 'templates/items.html',

            resolve: {
              initials: function() {
                return {
                  filters: d.filters? d.filters: d.slug? {
                    tags__category: 'writing',
                    tags__slug: d.slug
                  }: {
                    tags__category: 'writing'
                  },
                  limit: 9,
                  orderby: d.orderby? d.orderby: d.slug === 'all' ? '-date,-date_last_modified' : '-date,-date_last_modified',
                  availabileOrderby: _.concat(d.slug === 'all' ? [] : [], [
                    {label:'issue', value:'data__issue,-date'},
                    {label:'newest', value:'-date,-date_last_modified'},
                    {label:'oldest', value:'date,-date_last_modified'},
                    {label:'lastmod', value:'-date_last_modified'},
                    {label:'titleaz', value:'title'},
                    {label:'titleza', value:'-title'}
                  ]),
                  description: 'home-description'
                };
              },
              items: function(StoryFactory, djangoFiltersService, initials) {
                return StoryFactory.get(djangoFiltersService(initials)).$promise;
              },

              model: function() {
                return 'story';
              },
              factory: function(StoryFactory) {
                return StoryFactory.get;
              },
              description: function (PageFactory, initials) {
                if (initials.description) {
                  return PageFactory.get({name: initials.description}).$promise;
                } else {
                  return null;
                }
              }
            }
          });
      });

    $stateProvider
      .state('search', {
        url: '/search',
        controller: 'SearchCtrl',
        reloadOnSearch : false,
        abstract: true,
        // reloadOnSearch : false,
        templateUrl: RUNTIME.static + 'templates/search.html',
        // resolve: {
        //   items: function(StoryFactory, $location) {
        //     var qs = $location.search()
        //     // transform filters keywords in using a service
        //     return StoryFactory.search(qs).$promise;
        //   },
        // }
      })
        .state('search.story', {
          url: '?q',
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',

          resolve: {
            initials: function() {

              return {}
            },

            items: function(StoryFactory, $stateParams, initials, djangoFiltersService) {//(StoryFactory, djangoFiltersService, initials) {
              return StoryFactory.search(djangoFiltersService($stateParams)).$promise;
            },
            model: function() {
              return 'story';
            },
            factory: function(StoryFactory) {
              return StoryFactory.search;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });

    $stateProvider
      .state('story', {
        url: '/story/:postId',
        controller: 'StoryCtrl',
        reloadOnSearch : false,
        templateUrl: RUNTIME.static + 'templates/story.html',
        resolve: {
          story: function(StoryFactory, $stateParams) {
            return StoryFactory.get({id: $stateParams.postId}).$promise;
          }
        }
      })
      .state('storygit', {
        url: '/story/:id/git/:commit',
        controller: 'StoryCtrl',
        reloadOnSearch : false,
        templateUrl: RUNTIME.static + 'templates/story.html',
        resolve: {
          story: function(StoryGitFactory, $stateParams) {
            return StoryGitFactory.getByGitTag({
              id: $stateParams.id,
              commit: $stateParams.commit
            }).$promise;
          }
        }
      })

        // .state('collection', {
        //   url: '/collection/:collectionId',
        //   controller: 'StoryCtrl',
        //   reloadOnSearch : false,
        //   templateUrl: RUNTIME.static + 'templates/story.html',
        //   resolve: {
        //     story: function(CollectionFactory, $stateParams) {
        //       return CollectionFactory.get({id: $stateParams.collectionId}).$promise;
        //     },
        //   }
        // })
        .state('story.story', { // i.e the chapters ;)
          url: '/:chapterId',
          controller: 'ChapterCtrl',
          reloadOnSearch : false,
          templateUrl: RUNTIME.static + 'templates/story.chapter.html',
          resolve: {
            chapter: function(StoryFactory, $stateParams) {
              return StoryFactory.get({id: $stateParams.chapterId}).$promise;
            },
          }
        });




    $stateProvider
      .state('notifications', {
        abstract: true,
        url: '/notifications',
        controller: 'NotificationsCtrl',
        templateUrl: RUNTIME.static + 'templates/notifications.html',
      })
        .state('notifications.activities', {
          url: '/activities',
          controller: 'ItemsCtrl',
          templateUrl: RUNTIME.static + 'templates/items.html',
          resolve: {
            initials: function() {

              return {}
            },
            items: function(PulseFactory, initials) {
              return PulseFactory.activities(initials).$promise;
            },
            model: function() {
              return 'action';
            },
            factory: function(PulseFactory) {
              return PulseFactory.get;
            },
            description: function (PageFactory, initials) {
              if (initials.description) {
                return PageFactory.get({name: initials.description}).$promise;
              } else {
                return null;
              }
            }
          }
        });


      /*
        All the rest are static pages and will download the md files directly
      */
    $stateProvider
      .state('page', {
        url: '/:name',
        controller: 'PageCtrl',
        templateUrl: RUNTIME.static + 'templates/md.html',
        resolve: {
          page: function(PageFactory, $stateParams) {
            return PageFactory.get({name: $stateParams.name}).$promise
          },
        }
      });
  })
  .run(function($window, $log, RUNTIME){
    $log.log('☕ app run, version: Kidding Tiger; analytics:', RUNTIME.settings.analytics? 'enabled': 'disabled');
    if(RUNTIME.settings.analytics)
      $window.ga('create', RUNTIME.settings.analytics || 'UA-XXXXXXXX-X', 'auto');
  })

