/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('timelineModule', [])

.directive('timeline', ['$parse', '$timeout', '$sce', '$filter',
function($parse, $timeout, $sce, $filter){
	return {
		templateUrl: '/videoApp/js/timeline/timeline.html',
		scope: {
			timelineData: '=tlData',
			currentTime: '=tlTime',
			currentDuration: '=tlDuration',
			defaultZoom: '@tlDefaultZoom'
		},
		link: {
			pre: function(scope, element, attrs){
				scope.timelineRenderData = [];
				scope.currentRenderTime = 0;
				scope.zoom = scope.defaultZoom ? scope.defaultZoom : 2;
				scope.zoomControl = null;
				scope.maxZoom = 0;

				var renderItems = function(){
					if(!scope.currentDuration) return;

					var zoom = parseInt(scope.zoom);
					var max_item = Math.ceil(scope.currentDuration / 1000);
					var res = [];

					var items_index = {};
					for(var i in scope.timelineData){
						var t = Math.floor(scope.timelineData[i].time / 1000);
						if(!scope.timelineData[i].img) continue;

						if(!items_index[t]){
							items_index[t] = [scope.timelineData[i]];
						} else {
							items_index[t].push(scope.timelineData[i]);
						}
					}

					if(zoom < 1) zoom = 1;

					for(var i = 0; i <= max_item; i += zoom){
						var imgs = [];
						for(var j = i; j < i + zoom; j++){
							if(items_index[j]) imgs = imgs.concat(items_index[j]);
						}
						res.push({
							time: i * 1000,
							maxTime: (i+zoom) * 1000,
							imgs: imgs
						});
					}

					if(i - zoom != max_item){
						res.push({ time: i * 1000, imgs: [] });
					}

					scope.timelineRenderData = res;

					var renderString = '';

					for(var i in res){
						var item = res[i];

						renderString += "<div data-item-id=\""+i+"\"\
							class=\"timeline-item";
						if(
							scope.currentRenderTime >= item.time
							&& scope.currentRenderTime < item.maxTime
						){
							renderString += ' active';
						}
						if(scope.zoom == 0){
							renderString += ' max-zoom';
						}
						renderString += "\">";
							renderString += '<div class="red-line"';
							var k = (item.maxTime - item.time) / 100;
							renderString += ' style="left: '+parseInt((scope.currentTime - item.time) / k) + '%' + ';"';
							renderString += '></div>';

							renderString += "<div class=\"timeline-image";
							if(item.imgs.length){
								renderString += ' with-image';
							}
							renderString += "\">";

							// img
							var limit = 10;
							if(item.imgs.length <= 4 && zoom > 0) limit = 4;
							if(item.imgs.length > 4 && zoom > 0) limit = 3;

							for(var j in item.imgs){
								if(j >= limit) break;

								var img = item.imgs[j];

								renderString += '<img src="'+img.thumb+'"';
								if(item.imgs.length > 1){
									renderString += ' class="small"';
								}
								renderString += ' data-img-id="'+(img.num - 1)+'" />';
							}

							if(item.imgs.length > 4 && zoom > 0){
								renderString += '<span class="timeline-more">\
									<a href="#" data-item-id=\"'+i+'\" onclick="return false;">More ('+(item.imgs.length - 3)+')</a>\
								</span>';
							}
							// end img

							renderString += "</div>";

							renderString += '<div class="timeline-scale-line"></div>\
								<div class="timeline-time">\
									<span>'+$filter('date')(item.time, 'mm:ss')+'</span>\
								</div>';

						renderString += "</div>";
					}

					element.find('.timeline-items').html('');
					element.find('.timeline-items').append(renderString);
				};

				var setScroll = function(){
					var over = $('.timeline-item.active', element).overflowing('.timeline-items');

					if(over){
						var w = $('.timeline-wrap .timeline-item', element).width();
						// for(var i in scope.timelineRenderData){
						// 	var item = scope.timelineRenderData[i];
						// 	if(scope.currentRenderTime >= item.time && scope.currentRenderTime <= item.maxTime){
						// 		var index = parseInt(i);
						// 		// $('.timeline-items', element).prop('scrollLeft', w * (index - 2) );
						// 	}
						// }
						var index = 0;
						$('.timeline-wrap .timeline-item', element).each(function(){
							if($(this).hasClass('active')){
								var s = $('.timeline-items', element).prop('scrollLeft');
								if(s < index * w){
									$('.timeline-items', element).prop('scrollLeft', w * (index) );
								} else {
									$('.timeline-items', element).prop('scrollLeft', w * (index - 4) );
								}
							}

							index++;
						});
					}
				};

				scope.$watch('timelineData', function(){
					renderItems();
					setScroll();
				}, true);

				var zoom_timer = null;
				scope.$watch('zoom', function(){
					if(zoom_timer){
						$timeout.cancel(zoom_timer);
					}

					zoom_timer = $timeout(function(){
						renderItems();
						setScroll();
						zoom_timer = null;
					}, 200);
				});

				scope.zoomAdd = function(i){
					var z = parseInt(scope.zoom);

					if(z + i > 0 && z + i <= scope.maxZoom){
						scope.zoomControl.simpleSlider('setValue', z + i);
					}
				};

				scope.zoomSet = function(i){
					if(i > 0 && i <= scope.maxZoom){
						scope.zoomControl.simpleSlider('setValue', i);
					}
				};

				scope.$watch('currentDuration', function(){
					if(!scope.currentDuration) return;

					renderItems();

					var dz = parseInt(Math.ceil(scope.currentDuration / 4) / 1000 + 1);

					var slider_values = [];
					for(var i = dz; i >= 1; i--){
						slider_values.push(i);
					}

					$('.size_wrap .slider', element).remove();
					
					scope.zoomControl = $('.size_wrap input', element).simpleSlider({
						allowedValues: slider_values,
						equalSteps: true,
						snap: true
					});
					scope.zoomControl.simpleSlider('setValue', dz);

					scope.maxZoom = dz;
					scope.zoom = dz;
				});

				scope.$watch('currentTime', function(){
					if(scope.currentTime != scope.currentRenderTime){
						scope.currentRenderTime = scope.currentTime;

						element.find('.timeline-item.active').removeClass('active');
						for(var i in scope.timelineRenderData){
							var item = scope.timelineRenderData[i];

							if(
								scope.currentRenderTime >= item.time
								&& scope.currentRenderTime < item.maxTime
							){
								$(element).find('div[data-item-id="'+i+'"]').addClass('active');

								var k = (item.maxTime - item.time) / 100;
								$(element).find('div[data-item-id="'+i+'"] .red-line')
									.css('left', parseInt((scope.currentTime - item.time) / k) + '%');
							}
						}

						setScroll();
					}
				});

				$(element).on('click', '.timeline-image img', function(e){
					var img = scope.timelineData[$(this).attr('data-img-id')];

					scope.$apply(function(){
						scope.select_screen(e, img);
					});
				});

				$(element).on('click', '.timeline-more a', function(e){
					var item = scope.timelineRenderData[$(this).attr('data-item-id')];

					scope.$apply(function(){
						scope.more_screen(e, item);
					});
				});

				scope.select_screen = function(e, img){
					e.preventDefault();

					if(attrs.tlOnSelect) $parse(attrs.tlOnSelect)(scope.$parent, {
						event: e,
						img: img
					});
				};

				scope.more_screen = function(e, item){
					e.preventDefault();

					if(scope.zoom > 1){
						var t = parseInt((item.maxTime - item.time) / 5 / 1000);
						scope.zoomSet(t);

						setScroll();
					}

					if(attrs.tlOnMore) $parse(attrs.tlOnMore)(scope.$parent, {
						event: e,
						item: item
					});
				};
			}
		}
	};
}]);