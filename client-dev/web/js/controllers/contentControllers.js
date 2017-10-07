angular.module('app')
.controller('ContentCtrl', 
    ['$rootScope', '$scope', 'Content', 'Collection', 'Youtube', 'Config',
    function($rootScope, $scope, Content, Collection, Youtube, Config) { 

    $rootScope.$on('selectFilter', function(event, data) {                
        $scope.selectChannel(data);
    });

    /**
     *  Banner 
    **/    
    $scope.banners = [];

    Collection
    .find({
        filter: {                 
            fields: {
                channelId: true, 
                thumbnails: true,
                channelTitle: true
            }, 
            order: name,
            limit: '5'
        }
    })
    .$promise
    .then(
    function (res) {                  
        
        angular.forEach(res, function (values) {                      
                                                 
            Youtube
            .channel({
                'key': Config.youtubeKey,
                'id': values.channelId,
                'part': 'brandingSettings'
            })
            .$promise
            .then(
            function (data) {
                // console.log(data.items[0].brandingSettings.image.bannerMobileMediumHdImageUrl);
                values.bannerImg = data.items[0].brandingSettings.image.bannerMobileMediumHdImageUrl
            });

        });

        $scope.banners = $scope.banners.concat(res);        
    });        



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

            if(res.length > 0) 
            {
                $scope.contents = $scope.contents.concat(res);
                $scope.disabled = false;
            } 
            else 
            {
                $scope.disabled = true; // Disable further calls if there are no more items
            }

            // console.log('more', $scope.contents);      

            //  angular.forEach(res, function (values) {                      
            //     $scope.contents.push(values);                                          
            // }); 
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        })
        .finally(function () {                                
            $scope.filter.skip = $scope.filter.skip + 15;    
        });        
    };

    $scope.selectChannel = function(channelId){

        if(channelId === 'all')
        {
            $scope.filter = {           
                include : ['audios'],            
                order: 'publishedAt DESC',
                limit: '15',
                skip: 0, 
                where: {             
                    deleted: false                                       
                }
            }
        }else
        {
            $scope.filter = {          
                include : ['audios'],             
                order: 'publishedAt DESC',
                limit: '15',
                skip: 0, 
                where: {
                    channelId: channelId,
                    deleted: false                                       
                }
            }
        }

        $scope.reset();
    };   

    $scope.filter = {      
        include : ['audios'],                 
        order: 'publishedAt DESC',
        limit: '15',
        skip: $scope.skip, 
        where: {
            deleted: false                                       
        }
    }

    $scope.reset();


    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };


}]);


