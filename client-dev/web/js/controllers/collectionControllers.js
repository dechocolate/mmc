angular.module('app')
.controller('CollectionCtrl', 
    ['$scope', '$window', '$http', 'Collection', 'Content', 'Config', 'Youtube', 'ModalService',
    function($scope, $window, $http, Collection, Content, Config, Youtube, ModalService) { 

    /**
     *  Collection List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];
        $scope.filter.skip = 0;
        $scope.disabled = false;        
        $scope.loadMore();
    };

    $scope.loadMore = function(){     

        $scope.disabled = true; 

        Collection
        .find({
            filter: $scope.filter    
        })
        .$promise
        .then(
        function (res) {                  
            
            if(res.length > 0) 
            {            
                angular.forEach(res, function (values) {                      
                    
                    Youtube
                    .channel({
                        'key': Config.youtubeKey,
                        'id': values.channelId,
                        'part': 'statistics'
                    })
                    .$promise
                    .then(
                    function (res) {
                        var data = res.items[0].statistics;                

                        values.viewCount = data.viewCount;                           
                        values.commentCount = data.commentCount;
                        values.subscriberCount = data.subscriberCount;
                        values.videoCount = data.videoCount;
                    });

                    getCount(values.channelId)
                    .then(function(count){                                            
                        values.count = count;
                    });

                    $scope.contents.push(values); 
                                                 
                });  // end foreach    
                $scope.disabled = false;
            } 
            else 
            {                
                $scope.disabled = true; // Disable further calls if there are no more items
            }
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        })
        .finally(function () {                                
            $scope.filter.skip = $scope.filter.skip + 15;  
        });        
    };


    var getCount = function(id){

        var promise = 
                Content
                .count({    
                    where: {
                        channelId: id                                       
                    }
                })
                .$promise
                .then(
                function (res) {                                   
                    return res.count;   
                },
                function (err) {                
                    console.log("err :: " + JSON.stringify(err));
                })
                .finally(function () {                                

                });      

        return promise;
    };

    $scope.filter = {                 
            order: name,
            limit: '15',
            skip: $scope.skip
        }

    $scope.reset();



    /**
     *  Collect Youtube Infomation
    **/
    $scope.CollectById = function (index, e) {

        var id = $(e.target).data('id');

        console.log($scope.contents[index]);
        $scope.contents[index].state = true;

        $http({
            method: 'POST' ,
            url: '/executeById',                        
            headers: {'Content-Type': 'application/json; charset=utf-8'}, 
            data: {channelId:id},
            type: 'json'
        }).success(function(res) {
            
            var data = JSON.parse(JSON.stringify(res));
            console.log(data);                    

        }).finally(function() {
            console.log('Complete');
        });
    };    

    $scope.deleteCollection = function(id, channelId){

        ModalService.showModal({
            templateUrl: "views/modal/confirm/confirm.html",
            controller: "ConfirmModalControllers"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {

                if(result){
                    Collection
                    .delete({
                        id: id
                    })
                    .$promise
                    .then(
                    function (res) {               
                        $window.location.reload(); 
                    },
                    function (err) {                
                        console.log("err :: " + JSON.stringify(err));
                    })
                    .finally(function () {                                

                    });                    
                }

            });
        });    
    };

    $scope.updateCollection = function(id, channelId){

        Collection
        .update({
            id: id,
            state: false
        })
        .$promise
        .then(
        function (res) {               
            console.log(res);
            $window.location.reload(); 
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        });

    };



    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };

}]);


