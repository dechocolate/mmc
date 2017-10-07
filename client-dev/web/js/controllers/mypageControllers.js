angular.module('app')
.controller('MypageCtrl', 
    ['$rootScope', '$scope', '$window', 'User', 'Content', 'Config', 'Youtube', 'ModalService', 'LoopBackAuth',
    function($rootScope, $scope, $window, User, Content, Config, Youtube, ModalService, LoopBackAuth) { 

    $rootScope.$on('selectMyChannel', function(event, data) {                
        
        $scope.filter = {          
            include : ['audios'],             
            order: 'publishedAt DESC',
            limit: '15',
            skip: 0, 
            where: {
                channelId: data,
                deleted: false                                       
            }
        }
        $scope.reset();
    });

	$scope.LoopBackAuth = LoopBackAuth;	

	/**
     *  Content List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];
        $scope.filter.skip = 0;
        $scope.disabled = false;        
        $scope.loadMore();
    };

    $scope.loadMore = function(){     

        $scope.disabled = true; 

        Content
        .find({
            filter: $scope.filter    
        })
        .$promise
        .then(
        function (res) {            

            console.log(res);
 
            if(res.length > 0) 
            {
                $scope.contents = $scope.contents.concat(res);
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

    $scope.filter = {          
        include : ['audios'],             
        order: 'publishedAt DESC',
        limit: '15',
        skip: 0, 
        where: {
            channelId: $scope.LoopBackAuth.channelId            
        }
    }


    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };

}]);
