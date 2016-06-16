angular.module('screenEditorModule', ['apiServiceModule'])

.directive('screeneditor', ['$parse', 'apiService', function($parse, apiService){
	return {
		templateUrl: '/videoApp/js/screenEditor/screenEditor.html',
		scope: {
			editedItem: '=seItem',
			allItems: '=seItems',
			saveResume: '=seSaveresume',
			videoType: '=seVideoType'
		},
		link: {
			pre: function(scope, element, attrs){
				var modal_el = $('#myModal');

				scope.$watch('editedItem', function(){
					if(scope.editedItem){
						modal_el.modal('show');
					} else {
						modal_el.modal('hide');
					}
				});

				var editor = null;
				var withSave = false;

				modal_el.on('shown.bs.modal', function(){
					scope.$apply(function(){
						scope.onShow();
					});
				});

				modal_el.on('hidden.bs.modal', function(){
					scope.$apply(function(){
						scope.onHide();
						scope.editedItem = null;
					});
				});

				scope.onPrev = function(){
					var cur_item = scope.editedItem;
					if(scope.allItems[cur_item.num - 2]){
						scope.editedItem.editor_data = editor.canvas.toObject();
						editor.close();

						scope.editedItem = scope.allItems[cur_item.num - 2];
						setTimeout(function(){
							scope.onShow();
						}, 0);
					}
				};

				scope.onNext = function(){
					var cur_item = scope.editedItem;
					if(scope.allItems[cur_item.num]){
						scope.editedItem.editor_data = editor.canvas.toObject();
						editor.close();

						scope.editedItem = scope.allItems[cur_item.num];
						setTimeout(function(){
							scope.onShow();
						}, 0);
					}
				};

				scope.onShow = function(){
					editor = new ImageEditor('#screen-editor');
					editor.oninit = function(){
						if(scope.editedItem.editor_data){
							editor.canvas.loadFromJSON(
								JSON.stringify(scope.editedItem.editor_data)
							);
						}
					};
				};

				var canvas = document.createElement('canvas');
				canvas.setAttribute('crossOrigin', 'anonymous');
				var context = canvas.getContext('2d');

				scope.onHide = function(){
					if(withSave){
						editor.canvas.deactivateAll();

						var new_img = editor.canvas.toDataURL();
						scope.editedItem.img = new_img;
						scope.editedItem.editor_data = null;

						var buffer_img = new Image();
						buffer_img.src = new_img;
						var ei = scope.editedItem;

						buffer_img.onload = function(){
							var k = this.width / 150;
							var w = 150;
							var h = parseInt(this.height / k);

							canvas.width = w;
							canvas.height = h;

							context.fillRect(0, 0, w, h);
							context.drawImage(this, 0, 0, w, h);

							scope.$apply(function(){
								ei.thumb = canvas.toDataURL('image/png');

								apiService.editScreen(ei.screen_id, {
									snapshot_time_ms: ei.time,
									image: ei.img,
									thumbnail: ei.thumb,
									name: ei.title,
									note: ei.descr,
									has_video_note: Number(ei.change_img || (editor.canvas._objects.length > 0))
								});
							});
						};

						if(!scope.editedItem.change_img){
							scope.editedItem.change_img = (editor.canvas._objects.length > 0);
						}

						withSave = false;
						
						if(scope.saveResume) scope.saveResume = false;
					} else {
						scope.editedItem.editor_data = editor.canvas.toObject();
					}

					editor.close();
				};

				scope.onSave = function(){
					withSave = true;
					modal_el.modal('hide');
				};
			}
		}
	}
}]);