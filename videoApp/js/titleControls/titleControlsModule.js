/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('titleControlsModule', ['xeditable', 'apiServiceModule'])

.run(['editableOptions', 'editableThemes', function(editableOptions, editableThemes) {
	// editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
}])

.directive('titlecontrols', ['$parse', '$compile', 'apiService', function($parse, $compile, apiService){
	return {
		templateUrl: '/videoApp/js/titleControls/titleControls.html',
		scope: {
			videoNum: '=tcVideoNum',
			videos: '=tcVideos'
		},
		link: {
			pre: function(scope, element, attrs){
				scope.onPrev = function(){
					if(attrs.tcOnPrev) $parse(attrs.tcOnPrev)(scope.$parent);
				};

				scope.onNext = function(){
					if(attrs.tcOnNext) $parse(attrs.tcOnNext)(scope.$parent);
				};

				scope.$watch('videos', function(){
					scope.videoObj = scope.videos[scope.videoNum - 1];
				});

				scope.$watch('videoNum', function(){
					scope.videoObj = scope.videos[scope.videoNum - 1];
				});

				scope.editTitle = function(){
					apiService.editProjectFile(scope.videoObj.id, { name: scope.videoObj.title });
				};

				scope.editDescr = function(){
					apiService.editProjectFile(scope.videoObj.id, { note: scope.videoObj.descr });
				};
			},

			post: function(scope, element, attrs){
				
			}
		}
	}
}]);