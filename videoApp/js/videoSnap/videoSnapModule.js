/* Copyright (C) 2016 Entenso - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ENTENSO public code license.
 *
 * You should have received a copy of the ENTENSO public code license with
 * this file. If not, please write to: aprihodko@entenso.com, or visit: http://entenso.com
 */
 
angular.module('videoSnapModule', [])

.directive('videosnap', ['$parse', function($parse){
	return {
		templateUrl: '/videoApp/js/videoSnap/videoSnap.html',
		scope: {
			currentVideo: '=vsVideo',
			currentDuration: '=vsDuration',
			currentTime: '=vsTime',
			videoIsMaster: '=vsMaster',
			saveResume: '=vsSaveresume',
			videoType: '=vsVideoType'
		},
		link: {
			pre: function(scope, element, attrs){
				var el = element.find('video');
				var img_el = element.find('img');
				
				var canvas = document.createElement('canvas');
				canvas.setAttribute('crossOrigin', 'anonymous');

				var context = canvas.getContext('2d');

				el.on('durationchange', function(){
					var self = this;

					scope.$apply(function(){
						scope.currentDuration = parseInt(self.duration * 1000);
					});
				});

				var old_time = null;

				var onTimeUpdate = function(video){
					var self = video;
					var t = parseInt(video.currentTime) * 1000;

					if(t != old_time){
						scope.videoIsMaster = true;
						scope.currentTime = parseInt(self.currentTime * 1000);

						old_time = t;
						if(attrs.vsOnTimeUpdate) $parse(attrs.vsOnTimeUpdate)(scope.$parent, {
							time: t
						});
					}
				};

				el.on('click', function(){
					if(this.paused) this.play();
					else this.pause();
				});

				var fullscreen = false;

				el.on('dblclick', function(){
					if(!fullscreen){
						if (this.requestFullscreen) {
							this.requestFullscreen();
						} else if (this.mozRequestFullScreen) {
							this.mozRequestFullScreen();
						} else if (this.webkitRequestFullscreen) {
							this.webkitRequestFullscreen();
						}
						fullscreen = true;
					} else {
						if(document.cancelFullScreen) {
							document.cancelFullScreen();
						} else if(document.mozCancelFullScreen) {
							document.mozCancelFullScreen();
						} else if(document.webkitCancelFullScreen) {
							document.webkitCancelFullScreen();
						}
						fullscreen = false;
					}
				});

				el.on('timeupdate', function(){
					var self = this;
					scope.$apply(function(){
						onTimeUpdate(self);
					});
				});

				scope.$watch('currentTime', function(){
					if(scope.videoIsMaster) return;

					var video = el[0];
					video.pause();
					video.currentTime = scope.currentTime / 1000;
				});

				scope.$watch('currentVideo', function(newVal){
					if(newVal){
						var video = el[0];
						if(video.children[0])
							video.removeChild(video.children[0]);
						var s = document.createElement('source');
						s.type = 'video/mp4';
						s.src = newVal;
						video.appendChild(s);
						video.load();
					}
				});

				scope.snapScreen = function(){
					if(scope.videoType){
						var video = el[0];
						video.pause();

						var w = video.videoWidth;
						var h = video.videoHeight;
					} else {
						var video = img_el[0];

						var w = video.width;
						var h = video.height;
					}

					canvas.width = w;
					canvas.height = h;
					context.fillRect(0, 0, w, h);
					context.drawImage(video, 0, 0, w, h);

					var full_img = canvas.toDataURL('image/png');

					var k = w / 150;
					w = 150;
					h = parseInt(h / k);

					canvas.width = w;
					canvas.height = h;
					context.fillRect(0, 0, w, h);
					context.drawImage(video, 0, 0, w, h);

					var thumb_img = canvas.toDataURL('image/png');

					if(attrs.vsOnSnap) $parse(attrs.vsOnSnap)(scope.$parent, {
						time: (scope.videoType) ? parseInt(video.currentTime * 1000) : parseInt(+(new Date()) / 1000),
						img: full_img,
						thumb: thumb_img
					});
				};

				scope.$watch('saveResume', function(newVal, oldVal){
					if(oldVal === true && newVal === false && scope.videoType){
						var video = el[0];
						video.play();
					}
				});
			}
		}
	}
}])

.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);