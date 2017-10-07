angular.module('adminApp')
    .controller('ModalCategoryCtrl', ['$scope', 'close', 'title', 'items', 'selected', 
        function($scope, close, title, items, selected) {


    $scope.title = title;
    $scope.items = items;
    $scope.selected = selected;

    if(!$scope.selected) $scope.selected = [];

    // check box 체크 여부 
    angular.forEach($scope.items, function(value){
        if($scope.selected.length > 0)
        {
            angular.forEach($scope.selected, function(selectedValue){    
                if(value.name == selectedValue) {
                    value.selected = true;      
                    value.checked = true;
                }
            });              
        }
        else
        {
            value.selected = false;      
        }
  	});  

    $scope.cancel = function(result) {
        close(null, 200); 
    };

    // 선택한 아이템을 arrary와 string 객체로 반환한다.
    $scope.ok = function () {    
    	
    	var arr = [];
    	var str = '';    	

    	angular.forEach($scope.items, function(value){

	    	if (value.selected){
	    		str += value.name + ',';
	    		arr.push(value.name);
	    	}; 
	  	});          	
	  	
	  	var res = {
	  		arr: arr,
	  		str: str.substring(0, str.length - 1)
	  	};              
	  	
        close(res, 200); 
    };

}]);