'use strict';

/**
 * @ngdoc overview
 * @name adminApp
 * @description
 * # adminApp
 *
 * Main module of the application.
 */
angular
.module('adminApp', [
	'lbServices',

	'ui.router',
        'ui.bootstrap',
	'ngCookies',
	'ngResource',
	'ngSanitize',

        'LocalStorageModule',

        'angularUtils.directives.dirPagination',
        
        'angularModalService',
        
        'ui.tree',

        'ui.bootstrap.datetimepicker',

        'toggle-switch',
        
        'ngTagsInput',
        'autocomplete'  
]);
