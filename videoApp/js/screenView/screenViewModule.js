/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('screenViewModule', [])

.directive('screenview', ['$parse', function($parse){
	return {
		templateUrl: '/videoApp/js/screenView/screenView.html',
		scope: {
			showItem: '=svItem',
			editedItem: '=svEditItem',
			allItems: '=svItems'
		},
		link: {
			pre: function(scope, element, attrs){
				var modal_el = $('div.modal', element);

				scope.$watch('showItem', function(){
					if(scope.showItem){
						modal_el.modal('show');
					} else {
						modal_el.modal('hide');
					}
				});

				modal_el.on('hidden.bs.modal', function(){
					scope.$apply(function(){
						scope.showItem = null;
					});
				});

				scope.onPrev = function(){
					var cur_item = scope.showItem;
					if(scope.allItems[cur_item.num - 2]){
						scope.showItem = scope.allItems[cur_item.num - 2];
					}
				};

				scope.onNext = function(){
					var cur_item = scope.showItem;
					if(scope.allItems[cur_item.num]){
						scope.showItem = scope.allItems[cur_item.num];
					}
				};

				scope.onAddNotes = function(){
					scope.editedItem = scope.showItem;
					modal_el.modal('hide');
				};
			}
		}
	}
}]);