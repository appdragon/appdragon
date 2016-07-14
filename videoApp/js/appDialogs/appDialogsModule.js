/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('appDialogsModule', [])

.provider('modalDialog', function(){
	var provider = {
		$get: ['$rootScope', '$q', '$document', '$compile', function($rootScope, $q, $document, $compile){
			var $modal = {};

			$modal.open = function(modalOptions){
				modalOptions = modalOptions || {};

				var modalResult = $q.defer();

				var instance = {
					result: modalResult.promise
				};

				modalOptions.appendTo = modalOptions.appendTo || $document.find('body').eq(0);

				var providedScope = modalOptions.scope || $rootScope;
				var modalScope = providedScope.$new();

				modalScope.dialogShow = true;
				modalScope.modalTitle = modalOptions.title;
				modalScope.modalBody = modalOptions.body;

				var el = angular.element('<modaldialog></modaldialog>');
				el.attr({
					'md-show': 'dialogShow'
				});

				var resultValue = null;

				modalScope.close = function(){
					modalScope.dialogShow = false;
				};

				modalScope.result = function(value){
					resultValue = value;
					modalScope.close();
				};

				el.on('hidden.bs.modal', function(e){
					modalScope.$apply(function(){
						if(resultValue === null){
							modalResult.reject();
						} else {
							modalResult.resolve(resultValue);
						}
					});
				});

				modalOptions.appendTo.append($compile(el)(modalScope));

				return instance;
			}

			return $modal;
		}]
	};

	return provider;
})

.directive('modaldialog', ['$parse', function($parse){
	return {
		templateUrl: '/videoApp/js/appDialogs/appDialogs.html',
		link: {
			post: function(scope, element, attrs){
				var el = $('div.modal', element);

				scope.$watch('dialogShow', function(){
					if(scope.dialogShow){
						el.modal('show');
					} else {
						el.modal('hide');
					}
				});
			}
		}
	}
}]);