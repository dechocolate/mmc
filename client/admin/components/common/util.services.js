angular.module('adminApp')
.service('UtilServices', 
    ['$http', function($http) {

    
    function secondsToTime(s){
        var h  = Math.floor( s / ( 60 * 60 ) );
            s -= h * ( 60 * 60 );
        var m  = Math.floor( s / 60 );
            s -= m * 60;
            s = Math.floor(s);

        if(s < 10) s = '0'+s;    
        if(m < 10) m = '0'+m;

        return {
            "h": h,
            "m": m,
            "s": s
        };
    };

    var yyyymmdd = function(date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
        var dd  = date.getDate().toString();
        return yyyy +"-"+ (mm[1]?mm:"0"+mm[0]) +"-"+ (dd[1]?dd:"0"+dd[0]); // padding
    };

    var mmdd = function(date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth()+1).toString(); // getMonth() is zero-based
        var dd  = date.getDate().toString();
        return (mm[1]?mm:"0"+mm[0]) +"/"+ (dd[1]?dd:"0"+dd[0]); // padding
    };

    var increaseDate = function(date){
        var parts = date.split("-");
        
        var dt = new Date(
            parseInt(parts[0], 10),      // year
            parseInt(parts[1], 10) - 1,  // month (starts with 0)
            parseInt(parts[2], 10)       // date
        );
        
        dt.setDate(dt.getDate() + 1);
        parts[0] = "" + dt.getFullYear();
        parts[1] = "" + (dt.getMonth() + 1);
          
        if (parts[1].length < 2) {
            parts[1] = "0" + parts[1];
        }
        
        parts[2] = "" + dt.getDate();
        
        if (parts[2].length < 2) {
            parts[2] = "0" + parts[2];
        }
        
        return parts.join("-");   
    };

    var currentAddress = function(lat, lng){

        $http.defaults.headers.common.Authorization = undefined;

        var promise;
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?language=ko&sensor=true&latlng=' +lat+ ',' +lng;        

        $rootScope.lat = lat;
        $rootScope.lng = lng;

        promise = $http({
                    method: 'GET',
                    url: url
                }).then(function successCallback(res) {
                    
                    var components = res.data.results[0].address_components;
                    var address = components[3].short_name +' '+ components[2].short_name +' '+ components[1].short_name;          

                    // if(null != $rootScope.user.accessToken)
                    //     $http.defaults.headers.common.Authorization = $rootScope.user.accessToken;

                    return address;
                }, function errorCallback(err) {
                      console.log('currentAddress err',JSON.stringify(err));            
                });        

        return promise;
    };

    var isEmpty = function(obj){
        var hasOwnProperty = Object.prototype.hasOwnProperty;

        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;

        // If it isn't an object at this point
        // it is empty, but it can't be anything *but* empty
        // Is it empty?  Depends on your application.
        if (typeof obj !== "object") return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and valueOf enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }

        return true;
    };    


    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    function removeValueByKey(data, target, key) {

        for (i = 0; i < data.length; i++) {
            for (j = 0; j < target.length; j++) {
                if (data[i][key] == target[j][key]) {
                    data.splice(i,1);
                }
            }
        }

        return data;
    }

    return {
        yyyymmdd: yyyymmdd,
        mmdd: mmdd,
        secondsToTime: secondsToTime,
        increaseDate: increaseDate,
        isEmpty: isEmpty,
        shuffle: shuffle,
        removeValueByKey: removeValueByKey       
    };

}]);