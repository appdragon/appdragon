/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('screenLibraryModule', [
	'appDialogsModule',
	'apiServiceModule'
])

.directive('screenlibrary', ['$parse', 'modalDialog', 'apiService', function($parse, modalDialog, apiService){
	return {
		templateUrl: '/videoApp/js/screenLibrary/screenLibrary.html',
		scope: {
			timelineData: '=slData',
			currentTime: '=slTime',
			editedItem: '=slEditedItem',
			showItem: '=slShowItem',
			videoType: '=slVideoType'
		},
		link: {
			pre: function(scope, element, attrs){
				var activeItem = null;

				var getActiveIndex = function(){
					for(var i in scope.timelineData){
						if(scope.currentTime == scope.timelineData[i].time){
							return i;
							break;
						}
					}
				};

				scope.select_screen = function(e, item, index){
					e.preventDefault();

					if(attrs.slOnSelect) $parse(attrs.slOnSelect)(scope.$parent, {
						event: e,
						item: item
					});

					activeItem = item;
				};

				scope.onEdit = function(){
					var active = getActiveIndex();
					if(active){
						active = scope.timelineData[active];
						scope.editedItem = active;
					}
				};

				scope.onShow = function(){
					var active = getActiveIndex();
					if(active){
						active = scope.timelineData[active];
						scope.showItem = active;
					}
				};

				scope.onRemove = function(){
					var active = getActiveIndex();
					if(active){
						modalDialog.open({
							title: 'DELETE SCREENSHOT',
							body: 'Are you sure you want to delete this screenshot?'
						}).result.then(function(){
							apiService.removeScreen(scope.timelineData[active].screen_id);

							scope.timelineData.splice(active, 1);
						});
					}
				};

				scope.onDownload = function(){
					var active = getActiveIndex();
					if(active){
						active = scope.timelineData[active];

						$('<a>').attr({href:active.img, download:active.title + '.png'})[0].click();
					}
				};

				scope.onSend = function(){
					var active = getActiveIndex();
					if(active){
						active = scope.timelineData[active];

						modalDialog.open({
							title: 'SEND SCREENSHOT TO EMAIL',
							body: 'Are you sure you want to send this screenshot?'
						}).result.then(function(){
							if(attrs.slOnSend) $parse(attrs.slOnSend)(scope.$parent, {
								item: active
							});
						});
					}
				};
			}
		}
	}
}])

.directive('screenlibrarycontrols', ['$parse', function($parse){
	return {
		templateUrl: '/videoApp/js/screenLibrary/screenLibraryControls.html',
		link: {
			pre: function(scope, element, attrs){
				// todo
			}
		}
	}
}]);