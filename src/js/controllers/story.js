/**
 * @ngdoc function
 * @name miller.controller:coreCtrl
 * @description
 * # CoreCtrl
 * common functions go here.
 */
angular.module('miller')
  .controller('StoryCtrl', function ($rootScope, $scope, $log, $filter, $timeout, $modal, story, StoryFactory, StoryGitFactory, CommentFactory, QueryParamsService, extendStoryItem, EVENTS, RUNTIME) {

    story = extendStoryItem(story, $scope.language);

    $scope.story = story;

    // is the story editable by the current user?
    $scope.story.isWritable = $scope.hasWritingPermission($scope.user, $scope.story);
    $scope.story.isReviewable = _.get($scope, 'review.assignee.username') == $scope.user.username;
    $scope.story.isUnderReview = ['review', 'editing', 'pending'].indexOf(story.status) !== -1;

    // is the layout table or other?
    $scope.layout = 'inline';

    // to know that something is busy
    $scope.isLoading = false;


    // openGRaph metadata coming from the story
    $scope.setOG({
      title: story.data.title[$scope.language] || story.title,
      description: story.data.abstract[$scope.language] || story.abstract,
      image: _(story.covers).map(function(d){
        return _.get(d,'snapshot') ||
               _.get(d,'metadata.thumbnail_url') ||
               _.get(d,'metadata.urls.Publishable') ||
               _.get(d,'metadata.urls.Preview') ||
               _.get(d,'metadata.url');
      }).first()
    })

    // set status DRAFT or PUBLIC to the document.
    $scope.setStatus = function(status){

      if(!$scope.user.is_staff && status == 'public'){
        $log.warn('StoryCtrl -> setStatus failed:', status);

        return;
      }
      $log.debug('StoryCtrl -> setStatus - status:', status);

      $scope.$emit(EVENTS.MESSAGE, 'saving');

      StoryFactory.update({
        id: $scope.story.id
      }, {
        title: $scope.story.title,
        status: status
      }, function(res) {
        console.log('StoryCtrl -> setStatus - new status:',res)
        $scope.story.status = res.status;
        $scope.$emit(EVENTS.MESSAGE, 'saved');
        $scope.unlock();
      });
    };

    // scope send for review, if(!$scope.user.is_staff)
    // ask for confirmation
    $scope.publish = function(){
      if($scope.isLoading){
        $log.warn('StoryCtrl > publish() is busy...');
        return
      }
      var coversModal = $modal({
        controller: function($scope){
          $scope.language = $scope.$parent.language;
          $scope.title = 'confirm.publish.title'
          $scope.question = 'confirm.publish.question'
          $scope.confirm = function(){
            $scope.isLoading = true;
            StoryFactory.publish({
              id: $scope.story.id
            }, {},function(res) {
              $scope.story.status = res.status;
              $scope.story.isUnderReview = ['review', 'editing', 'pending'].indexOf(res.status) !== -1;
              $scope.$hide();
            }, $scope.unlock);
          }
          $scope.dismiss = function(){
            $scope.setStatus('draft')
          }
        },
        placement: 'confirm',
        templateUrl: RUNTIME.static + 'templates/partials/modals/confirm.html',
        show: true,
        scope: $scope
      })
    };

    $scope.comments = [];
    $scope.commentsCount = 0;
    $scope.isLoadingComments = false;
    $scope.commentsNextParams = {};

    $scope.loadComments = function(){
      if($scope.isLoadingComments) {
        $log.warn('StoryCtrl > loadComments() is busy loading...!')
        return;
      }
      $scope.isLoadingComments = true;
      $log.log('StoryCtrl > loadComments() loading...')

      StoryFactory.getComments(angular.extend({
        id: story.id,
        filters: JSON.stringify({
          version: story.version
        }),
        orderby: '-date_created'
      }, $scope.commentsNextParams), function(res){
        $scope.comments = ($scope.comments || []).concat(res.results);
        $scope.commentsCount = res.count;
        $scope.commentsNextParams = QueryParamsService(res.next || '');

        $scope.isLoadingComments = false;
        $log.log('StoryCtrl > loadComments() loaded. Next:', $scope.commentsNextParams)
      }, function(e){
        $scope.isLoadingComments = false;
        $log.error(e)
      })
    }

    $scope.moreComments = function() {
      $scope.loadComments();
    }

    // if commented, reset comments list before reloading.
    $scope.commented = function(error, comment){
      $log.log('StoryCtrl > commented() deprecaed');
    };

    $scope.removeComment = function(comment) {
      comment.disappear = true;
      if($scope.isLoadingComments) {
        $log.warn('StoryCtrl > removeComment() is busy loading...!')
        return;
      }

      $log.log('StoryCtrl > removeComment() comment:', comment.short_url);
      $scope.isLoadingComments = true;

      CommentFactory.delete({
        id: comment.short_url
      }, function(res){
        $scope.isLoadingComments = false;
        $log.log('StoryCtrl > removeComment() success!', comment.short_url);
      }, function(){
        $scope.isLoadingComments = false;
      });
    }


    // load previous and next.
    $scope.loadNeighbors = function(){
      StoryFactory.getNeighbors({
        id: story.id
      }, function(res){
        $scope.neighbors = res;
      })
    };
    // autoload

    $timeout($scope.loadNeighbors(), 2000);

    // load available GIT TAGGED versions of the story.
    $scope.versions = [];
    $scope.isLoadingVersions = false;

    $scope.loadVersions = function(){
      $scope.isLoadingVersions = true;

      StoryGitFactory.getByGitTag({
        id: story.id
      }, function(res) {
        console.log(res);
        $scope.isLoadingVersions = false;
        $scope.versions = res.results;
      }, function(err) {
        console.error(err);
        $scope.isLoadingVersions = false;
      })
    }


    $scope.createReview = function(){
      $scope.setStatus("review");
    }


    $scope.download = function() {
      StoryFactory.download({
        id: $scope.story.id
      }).$promise.then(function(result) {
        var url = URL.createObjectURL(new Blob([result.data]));
        var a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.target = '_blank';
        a.click();
      })
      .catch(function(error) {
        console.log(error); // in JSON
      });
    }

    $scope.listener = function(event, data, callback) {
      $log.log('StoryCtrl > listener, event:', event, data);

      switch(event){
        case EVENTS.MARKDOWNIT_FOCUS:
          // cfr. in service MarkdownitService idx is the item index
          // of every special link. Each link will then have a special id 'item-N'
          // N revealing the ordering.
          $scope.focusedIdx = data.idx
          break;
        case EVENTS.MARKDOWNIT_FULLSIZE:
          $rootScope.fullsize(data.slug.replace(/\//g,'-'), data.type);
          break;
        case EVENTS.MARKDOWNIT_RESOLVE:
          $rootScope.resolve(data.slug.replace(/\//g,'-'), data.type, callback);
          break;
      }
    }


    $log.log('StoryCtrl ready, title:', story.title, 'isWritable:', $scope.story.isWritable);
    // $scope.cover = _(story.documents).filter({type: 'video-cover'}).first();

    // $scope.hasCoverVideo = $scope.cover !== undefined;

    // guess if there's a document interview
    // cfr corectrl setDocuments function.
    $scope.setDocuments = function(items) {
      $log.log('StoryCtrl > setDocuments items n.:', items.length, items);

      var documents = [];

      $scope.sidedocuments = 0;

      documents = _(items)
        .map(function(d){
          // check if it is in the story.documents list
          for(var i=0;i<story.documents.length;i++){
            if(story.documents[i].slug == d.slug){
              $scope.sidedocuments += !!d.citation.length;
              return angular.extend({
                _type: d._type,
                _index: d._index,
                citation: d.citation
              }, story.documents[i]);
            }
          }

          for(i=0;i<story.stories.length;i++){
            if(story.stories[i].slug == d.slug){
              $scope.sidedocuments += !!d.citation.length;
              return angular.extend({
                _type: d._type,
                _index: d._index,
                citation: d.citation
              }, story.stories[i]);
            }
          }
          $scope.sidedocuments++;
          // this is another story or a footnote or a missing document (weird)
          // will be lazily filled with stuffs later
          return d;
        }).value();

      $log.log('StoryCtrl > setDocuments items n.:', items.length, '- documents n:', documents.length, '- sideDocuments:', $scope.sidedocuments );
      // $rootScope.emit(documents = documents;
      $scope.$parent.setDocuments(documents);
    };

    // given the shortUrl, preload the comment item
    // params uids: list of shortUrls to preload.
    $scope.commentsSelected = function(uids) {
      $log.log('StoryCtrl > commentsSelected uids:', uids);
    }

    // listener for SOCKET_USER_COMMENTED_STORY event, cfr. PulseCtrl.
    $rootScope.$on(EVENTS.SOCKET_USER_COMMENTED_STORY, _.debounce(function(e, data) {

        if(data.target.id == story.id){
          $log.log('StoryCtrl @SOCKET_USER_COMMENTED_STORY, update the comment list!')
          if(data.info.comment.highlights) {
            $scope.story.highlights.push(data.info.comment.highlights);
          }
          data.info.comment.unread = true;
          $scope.comments.unshift(data.info.comment);



          $scope.commentsCount++;
          if($scope.commentsNextParams.offset)
            $scope.commentsNextParams.offset++;

          $scope.$apply();
        }
    }, 200));

    // listener for SOCKET_USER_UNCOMMENTED_STORY event, cfr. PulseCtrl.
    $rootScope.$on(EVENTS.SOCKET_USER_UNCOMMENTED_STORY, function(event, data) {
      if(data.target.id == story.id){
        $log.log('StoryCtrl @SOCKET_USER_UNCOMMENTED_STORY, update the comment list!', $scope.comments);
        // present i scope comments?

        $scope.commentsCount--;

        $scope.comments = _.filter($scope.comments, function(d) {
          return d.short_url != data.info.comment.short_url
        });

        if(data.info.comment.highlights && data.info.comment.highlights.length) {
          $scope.story.highlights = _.filter($scope.story.highlights, function(d) {
            return d != data.info.comment.highlights
          });
        }
        $scope.$apply();
      }
    });

    $scope.findCategory = function (tags) {
        console.log("findCategory");
        var categories = tags.filter(t=> t.category === "writing");
        if(categories && categories.length > 0) {
            return categories[0].slug;
        }
        return null;
    };
  });
