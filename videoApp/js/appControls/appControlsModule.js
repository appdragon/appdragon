/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('appControlsModule', [
	'appDialogsModule',
	'apiServiceModule'
])

.directive('appcontrols', ['$parse', 'modalDialog', 'apiService', function($parse, modalDialog, apiService){
	return {
		templateUrl: '/videoApp/js/appControls/appControls.html',
		link: {
			pre: function(scope, element, attrs){
				scope.onSend = function(){
					modalDialog.open({
						title: 'SEND ALL SCREENSHOTS TO EMAIL',
						body: 'Are you sure you want to send screenshot?'
					}).result.then(function(){
						if(attrs.acOnSend) $parse(attrs.acOnSend)(scope);
					});
				};

				scope.onRemove = function(){
					modalDialog.open({
						title: 'DELETE ALL SCREENSHOTS',
						body: 'Are you sure you want to delete ALL screenshots?'
					}).result.then(function(){
						if(attrs.acOnRemove) $parse(attrs.acOnRemove)(scope);
					});
				};
			}
		}
	}
}]);