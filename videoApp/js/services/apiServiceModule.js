angular.module('apiServiceModule', ['appConfig'])

.factory('apiService', ['API_SERVER', '$q', '$http', '$cacheFactory', function(API_SERVER, $q, $http, $cacheFactory){
	var project_cache = $cacheFactory('videoNotesProjectCache');

	return {
		auth_token: null,

		getAuthToken: function(){
			var self = this;
			var def = $q.defer();

			$http({
				method: 'POST',
				url: '/api/tokens/authenticate'
			}).then(function(res){
				self.auth_token = res.data.data.token;
				def.resolve();
			}, function(){
				def.reject();
			});

			return def.promise;
		},

		getCategories: function(){
			var def = $q.defer();

			$http({
				method: 'GET',
				url: '/api/categories'
			}).then(function(res){
				def.resolve(res.data.data.items);
			}, function(){
				def.reject();
			});

			return def.promise;
		},

		getVideoDurations: function(){
			var def = $q.defer();

			$http({
				method: 'GET',
				url: API_SERVER + '/video-durations'
			}).then(function(res){
				def.resolve(res.data.data.items);
			}, function(){
				def.reject();
			});

			return def.promise;
		},

		getAudioGenres: function(){
			var def = $q.defer();

			$http({
				method: 'GET',
				url: API_SERVER + '/audio-genres'
			}).then(function(res){
				def.resolve(res.data.data.items);
			}, function(){
				def.reject();
			});

			return def.promise;
		},

		getProject: function(project_id, without_cache){
			var def = $q.defer();

			if(without_cache){
				project_cache.remove('project_'+project_id);
			}

			var project = project_cache.get('project_'+project_id);

			if(!project){
				$http({
					method: 'GET',
					url: API_SERVER + '/project/project-with-files-and-screenshots/'+project_id
					// url: '/videoApp/getProject.json'
				}).then(function(res){
					var res_data = {
						files: [],
						project: res.data.data
					};

					var files = res.data.data.project_files;
					// var screenshots = res.data.data.items.screenshots;

					for(var i in files){
						var file = files[i];

						var project_file = {
							id: file.project_file_id,
							title: file.name,
							descr: file.note,
							video_src: file.url,
							screen_data: [],
							video_type: (/.*\.(jpg|jpeg|png)$/.test(file.url)) ? false : true
						};

						var c = 1;

						for(var j in file.screenshots){
							var screen_item = file.screenshots[j];
							
							project_file.screen_data.push({
								screen_id: screen_item.screen_id,
								time: parseInt(screen_item.snapshot_time_ms),
								img: screen_item.media_formatted.big,
								thumb: screen_item.media_formatted.small,
								title: screen_item.name,
								num: c++,
								change_img: Boolean(screen_item.has_video_note),
								descr: screen_item.note,
								editor_data: null
							});
						}

						res_data.files.push(project_file);
					}

					project_cache.put('project_'+project_id, res_data);

					def.resolve(res_data);
				}, function(err){
					def.reject(err);
				});
			} else {
				def.resolve(project);
			}

			return def.promise;
		},

		editProject: function(project_id, data){
			var self = this;

			return $http({
				method: 'PUT',
				url: API_SERVER + '/projects/'+project_id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				params: { token: self.auth_token },
				data: jQuery.param(data)
			});
		},

		editProjectFile: function(file_id, data){
			return $http({
				method: 'PUT',
				url: API_SERVER + '/file/'+file_id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: jQuery.param(data)
			});
		},

		removeProjectFile: function(file_id){
			return $http({
				method: 'DELETE',
				url: API_SERVER + '/file/'+file_id
			});
		},

		addScreen: function(file_id, screen_item){
			return $http({
				method: 'POST',
				url: API_SERVER + '/screen/'+file_id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: jQuery.param(screen_item)
			});
		},

		removeScreen: function(screen_id){
			return $http({
				method: 'DELETE',
				url: API_SERVER + '/screen/'+screen_id
			});
		},

		editScreen: function(screen_id, screen_item){
			return $http({
				method: 'PUT',
				url: API_SERVER + '/screen/'+screen_id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: jQuery.param(screen_item)
			});
		},

		removeAllScreen: function(file_id){
			return $http({
				method: 'DELETE',
				url: API_SERVER + '/screen/remove-all/'+file_id
			});
		},

		sendScreenToEmail: function(screen_id){
			return $http({
				method: 'POST',
				url: API_SERVER + '/screen/send-to-email/'+screen_id
			});
		},

		sendAllScreenToEmail: function(file_id){
			return $http({
				method: 'POST',
				url: API_SERVER + '/screen/send-all-to-email/'+file_id
			});
		},

		submitProject: function(project_id, phone){
			return $http({
				method: 'POST',
				url: API_SERVER + '/project/submit-to-video-editor/'+project_id,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: jQuery.param({
					phone: phone
				})
			});
		}
	};
}]);