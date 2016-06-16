angular.module('videoApp', [
	'ngRoute', 'ngSanitize',
	'apiServiceModule',
	'timelineModule',
	'videoSnapModule',
	'screenLibraryModule',
	'screenEditorModule',
	'appControlsModule',
	'screenViewModule',
	'titleControlsModule',
	'appDialogsModule',
	'xeditable', 'ui.bootstrap',
	'ngTagsInput'
])

.run([
	'$route', '$rootScope', '$location', 'apiService', 'editableOptions',
	function ($route, $rootScope, $location, apiService, editableOptions) {
	// todo: would be proper to change this to decorators of $location and $route
	$location.update_path = function (path, keep_previous_path_in_history) {
		if ($location.path() == path) return;

		var routeToKeep = $route.current;
		$rootScope.$on('$locationChangeSuccess', function () {
			if (routeToKeep) {
				$route.current = routeToKeep;
				routeToKeep = null;
			}
		});

		$location.path(path);
		if (!keep_previous_path_in_history) $location.replace();
	};

	$rootScope.binarySwitch = [
		{ id: 0, name: 'No' },
		{ id: 1, name: 'Yes' }
	];

	apiService.getAuthToken().then(function(){
		$rootScope.auth_token = apiService.auth_token;
		
		return apiService.getCategories();
	}).then(function(cats){
		$rootScope.categories = cats;
		return apiService.getVideoDurations();
	}).then(function(dur){
		$rootScope.videoDur = dur;
		return apiService.getAudioGenres();
	}).then(function(gen){
		$rootScope.audioGen = gen;
	});

	editableOptions.theme = 'bs3';
}])

.config(['$routeProvider', function($routeProvider){
	$routeProvider
		.when('/project/:project_id', {
			templateUrl: '/videoApp/js/projectLayout.html',
			controller: 'projectController'
		})
		.when('/videoNotes/:project_id/:video_id', {
			templateUrl: '/videoApp/js/notesLayout.html',
			controller: 'notesController'
		});
}])

.controller('projectController', [
	'$scope', '$routeParams', 'apiService', '$location', '$filter',
	'modalDialog', '$timeout', '$rootScope',
	
function($scope, $routeParams, apiService, $location, $filter, modalDialog, $timeout, $rootScope){
	$scope.videos = [];
	$scope.project_id = $routeParams.project_id;
	$scope.project = null;

	$scope.collapseAll = false;

	apiService.getProject($routeParams.project_id).then(function(res){
		$scope.videos = res.files;
		$scope.project = res.project;
	}).catch(function(err){
		console.error(err);
	});

	$scope.showVideoNotes = function(file_id){
		$location.path('/videoNotes/'+$scope.project_id+'/'+file_id);
	};

	$scope.deleteVideoFile = function(file_id, file_index){
		modalDialog.open({
			title: 'DELETE FILE',
			body: 'Are you sure you want to delete this file?'
		}).result.then(function(){
			apiService.removeProjectFile(file_id);
			$scope.videos.splice(file_index, 1);
		});
	};

	$scope.editTitle = function(file_id, title){
		apiService.editProjectFile(file_id, { name: title });
	};

	$scope.editDescr = function(file_id, descr){
		apiService.editProjectFile(file_id, { note: descr });
	};

	$scope.editProjectData = function(data){
		if(data.due_date) data.due_date = $filter('date')(data.due_date, 'yyyy-MM-dd');
		if(data.category){
			for(var i in $scope.categories){
				if($scope.categories[i].id == data.category){
					$scope.project.project_category.name = $scope.categories[i].name;
					break;
				}
			}
		}

		if(data.video_duration){
			for(var i in $scope.videoDur){
				if($scope.videoDur[i].id == data.video_duration){
					$scope.project.project_video_duration.title = $scope.videoDur[i].name;
					break;
				}
			}
		}

		if(data.video_duration){
			for(var i in $scope.videoDur){
				if($scope.videoDur[i].id == data.video_duration){
					$scope.project.project_video_duration.title = $scope.videoDur[i].name;
					break;
				}
			}
		}

		return apiService.editProject($scope.project_id, data);
	};

	$scope.uploadFile = function(){
		$('#fileupload').trigger('click');
	};

	FileUploader($scope.project_id, function(){
		apiService.getProject($routeParams.project_id, true).then(function(res){
			$scope.videos = res.files;
			$scope.project = res.project;
		});
	});

	$scope.inlineOptions = {
		minDate: new Date(),
		showWeeks: true
	};

	$scope.project_due_date_popover = false;
	$scope.closeDatePopover = function(){
		$scope.project_due_date_popover = false;
		$scope.editProjectData({ due_date: $scope.project.project_due_date.iso });
	};

	$scope.budget = {
		budget_type: 'budget_fixed',
		budget_fixed: 0,
		budget_min: 0,
		budget_max: 0
	};

	$scope.$watch('project', function(){
		if($scope.project){
			$scope.budget.budget_type = $scope.project.project_budget.type;

			if($scope.project.project_budget.type == 'budget_fixed'){
				$scope.budget.budget_fixed = $scope.project.project_budget.raw;
			}

			if($scope.project.project_budget.type == 'budget_range'){
				$scope.budget.budget_min = $scope.project.project_budget.raw.min;
				$scope.budget.budget_max = $scope.project.project_budget.raw.max;
			}

			if($scope.project.project_audio_genre.raw){
				$scope.audio_genre.id = $scope.project.project_audio_genre.raw;
			}

			if($scope.project.project_audio_subgenre.raw){
				$scope.audio_genre.sub_id = $scope.project.project_audio_subgenre.raw;
			}
		}
	});

	$scope.project_budget_popover = false;
	$scope.closeBudgetPopover = function(){
		switch($scope.budget.budget_type){
			case 'budget_fixed':
				$scope.editProjectData({ budget_fixed: parseInt($scope.budget.budget_fixed) }).then(function(res){
					if(res.data.data && res.data.data.project_budget){
						$scope.project.project_budget = res.data.data.project_budget;
					}
				});

				$scope.project_budget_popover = false;
				break;
			case 'budget_range':
				if($scope.budget.budget_min > $scope.budget.budget_max){
					break;
				}

				$scope.editProjectData({
					budget_min: parseInt($scope.budget.budget_min),
					budget_max: parseInt($scope.budget.budget_max)
				}).then(function(res){
					if(res.data.data && res.data.data.project_budget){
						$scope.project.project_budget = res.data.data.project_budget;
					}
				});

				$scope.project_budget_popover = false;
				break;
			case 'budget_bid':
				$scope.editProjectData({ allow_bid: 1 }).then(function(res){
					if(res.data.data && res.data.data.project_budget){
						$scope.project.project_budget = res.data.data.project_budget;
					}
				});
				
				$scope.project_budget_popover = false;
				break;
		}
	};

	$scope.project_tags = [
		{ text: 'tag1' },
		{ text: 'tag2' },
		{ text: 'tag3' }
	];

	$scope.project_tags_popover = false;
	$scope.closeTagsPopover = function(){
		$scope.project_tags_popover = false;
	};

	$scope.audio_genre = { id: 0, sub_id: 0 };

	$scope.project_audio_popover = false;
	$scope.closeAudioPopover = function(){
		$scope.project_audio_popover = false;

		var gen = null;
		for(var i in $rootScope.audioGen){
			if($rootScope.audioGen[i].id == $scope.audio_genre.id){
				gen = $rootScope.audioGen[i];
				break;
			}
		}

		var sub_gen = null;
		for(var i in $rootScope.audioGen){
			if($rootScope.audioGen[i].id == $scope.audio_genre.sub_id){
				sub_gen = $rootScope.audioGen[i];
				break;
			}
		}
		
		$scope.project.project_audio_genre.raw = gen.id;
		$scope.project.project_audio_genre.formatted = gen.name;
		$scope.project.project_audio_subgenre.raw = sub_gen.id;
		$scope.project.project_audio_subgenre.formatted = sub_gen.name;

		$scope.editProjectData({
			audio_genre_id: $scope.audio_genre.id,
			audio_sub_genre_id: $scope.audio_genre.sub_id
		});
	};

	$scope.phone_reg = /^\+?[0-9]{10,14}$/;

	$scope.submitProject = function(){
		if($scope.videos.length == 0){
			$('#confirm-modal-notes').modal('show');
		} else {
			$scope.submitProjectPhone();
		}
	};

	$scope.submitProjectPhone = function(){
		$('#confirm-modal-submit form input').val('');
		$('#confirm-modal-submit').modal('show');
	};

	$scope.submitProjectConfirm = function(phone){
		if(!phone.$invalid){
			apiService.submitProject($scope.project_id, phone.$modelValue);
			$('#confirm-modal-submit').modal('hide');
		}
	};
}])

.filter('trusted', ['$sce', function ($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}])

.controller('notesController', [
	'$scope', '$routeParams', '$location', 'apiService',
function($scope, $routeParams, $location, apiService){
	$scope.videos = [];
	$scope.video_id = $routeParams.video_id;

	window.scrollTo(0,0);

	apiService.getProject($routeParams.project_id).then(function(res){
		$scope.videos = res.files;

		var n = 1;
		for(var i in $scope.videos){
			if($scope.videos[i].id == $routeParams.video_id){
				$scope.video_num = n;
				break;
			}
			n++;
		}
	}, function(err){
		console.error(err);
	});

	$scope.prevVideo = function(){
		if($scope.video_num > 1){
			$scope.video_num--;

			$scope.currentVideoTime = 0;
			$scope.currentTimelineTime = 0;
			$scope.videoIsMaster = false;

			$location.update_path('/videoNotes/'+$routeParams.project_id+'/'+$scope.videos[$scope.video_num - 1].id);
		}
	};

	$scope.nextVideo = function(){
		if($scope.video_num < $scope.videos.length){
			$scope.video_num++;

			$scope.currentVideoTime = 0;
			$scope.currentTimelineTime = 0;
			$scope.videoIsMaster = false;

			$location.update_path('/videoNotes/'+$routeParams.project_id+'/'+$scope.videos[$scope.video_num - 1].id);
		}
	};

	$scope.currentVideoTime = 0;
	$scope.currentTimelineTime = 0;
	$scope.videoIsMaster = false;

	$scope.currentDuration = 0;

	$scope.editedItem = null;

	$scope.showItem = null;

	$scope.videoSnapResume = false;

	$scope.screenSelected = function(item){
		$scope.videoIsMaster = false;
		$scope.currentVideoTime = item.time;
	};

	$scope.upTime = function(t){
		$scope.currentTimelineTime = t;
	};

	$scope.snapScreen = function(time, img, thumb){
		if($scope.videos[$scope.video_num - 1].video_type){
			for(var i in $scope.videos[$scope.video_num - 1].screen_data){
				var item = $scope.videos[$scope.video_num - 1].screen_data[i];
				if(item.time == time) return;
			}
		}

		var screen_index = $scope.video_num - 1;
		var screen_name = 'Screenshot '+Number(new Date());

		var i = $scope.videos[screen_index].screen_data.push({
			time: time,
			img: img,
			thumb: thumb,
			title: screen_name,
			num: $scope.videos[screen_index].screen_data.length + 1,
			change_img: false,
			descr: '',
			editor_data: null,
			the_new: true
		});

		apiService.addScreen($scope.videos[screen_index].id, {
			snapshot_time_ms: time,
			image: img,
			thumbnail: thumb,
			name: screen_name,
			note: '',
			has_video_note: 0
		}).then(function(res){
			$scope.videos[screen_index].screen_data[i - 1].screen_id = res.data.data.screen_id;
			$scope.videos[screen_index].screen_data[i - 1].file_id = $scope.videos[screen_index].file_id;
		});

		$scope.videoSnapResume = true;
		$scope.editedItem = $scope.videos[$scope.video_num - 1].screen_data[i - 1];
	};

	$scope.sendScreenToEmail = function(item){
		apiService.sendScreenToEmail(item.screen_id);
	};

	$scope.sendAllScreenToEmail = function(){
		apiService.sendAllScreenToEmail($scope.videos[$scope.video_num - 1].id);
	};

	$scope.removeAll = function(){
		$scope.videos[$scope.video_num - 1].screen_data = [];

		apiService.removeAllScreen($scope.videos[$scope.video_num - 1].id);
	};
}]);