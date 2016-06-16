(function(window, $, fabric){
	var createButton = function(button_class, action){
		return $('<button/>', {
			type: 'button',
			'class': 'editor-btn',
			'data-action': action
		}).append('<span class="'+button_class+'"></span>');
	};

	var Math_helper = {
		upperAndLowerOfTwoPoints: function (x1, y1, x2, y2) {
			var lower = {x: 0, y: 0};
			var upper = {x: 0, y: 0};
			if (x1 < x2) {
				lower.x = x1;
				upper.x = x2;
			} else {
				lower.x = x2;
				upper.x = x1;
			}
			if (y1 < y2) {
				lower.y = y1;
				upper.y = y2;
			} else {
				lower.y = y2;
				upper.y = y1;
			}
			return {lower: lower, upper: upper};
		},
		getMiddlePointBetweenTwoPoints: function (x1, y1, x2, y2) {
			var points = this.calculate.upperAndLowerOfTwoPoints(x1, y1, x2, y2);
			return {
				x: points.lower.x + ((points.upper.x - points.lower.x) / 2),
				y: points.lower.y + ((points.upper.y - points.lower.y) / 2)
			}
		},
		lineLength: function (x1, y1, x2, y2) {
			return Math.sqrt(Math.pow(x2 * 1 - x1 * 1, 2) + Math.pow(y2 * 1 - y1 * 1, 2));
		},
		getAngleInDegrees: function (x1, y1, x2, y2) {
			return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
		},
		getTextPosition: function (x1, y1, x2, y2) {
			var angle = this.getAngleInDegrees(x1, y1, x2, y2);
			var pos = {};
			var limits = {x: 100, y: 40};
			if (angle >= -45 && angle <= 45) {
				pos.originX = 'right';
				pos.originY = 'center';
			}
			if (angle > 45 && angle < 135) {
				pos.originX = 'center';
				pos.originY = 'bottom';
			}
			if ((angle >= 135 && angle <= 180) || (angle <= -135 && angle >= -180)) {
				pos.originX = 'left';
				pos.originY = 'center';
			}
			if (angle > -135 && angle < -45) {
				pos.originX = 'center';
				pos.originY = 'top';
			}

			if (x1 < limits.x)
				pos.originX = 'left';
			// if (x1 > (canvas.width - limits.x))
			// 	pos.originX = 'right';

			if (y1 < limits.y)
				pos.originY = 'top';
			// if (y1 > (canvas.height - limits.y))
			// 	pos.originY = 'bottom';
			return pos;
		}
	};

	fabric.Object.prototype.toObject = (function (toObject) {
		return function () {
			switch(this.objectType){
				case 'lineArrow':
				case 'lineArrowText':
					return fabric.util.object.extend(toObject.call(this), {
						id: this.id,
						objectType: this.objectType,
						objectSubType: this.objectSubType,
						groupID: this.groupID,
						lockScalingX: this.lockScalingX,
						lockScalingY: this.lockScalingY,
						lockRotation: this.lockRotation,
						hasControls: this.hasControls,
						_controlOpt: this._controlOpt,
						textOffset_x: this.textOffset_x,
						textOffset_y: this.textOffset_y,
						old_left: this.old_left,
						old_top: this.old_top,
						stroke: this.stroke,
						fill: this.fill,
						perPixelTargetFind: this.perPixelTargetFind
					});
					break;
				case 'line':
					return fabric.util.object.extend(toObject.call(this), {
						id: this.id,
						objectType: this.objectType,
						objectSubType: this.objectSubType,
						groupID: this.groupID,
						lockScalingY: this.lockScalingY,
						_controlOpt: this._controlOpt,
						stroke: this.stroke,
						fill: this.fill,
						perPixelTargetFind: this.perPixelTargetFind
					});
					break;
				default:
					return fabric.util.object.extend(toObject.call(this), {
						id: this.id,
						objectType: this.objectType,
						objectSubType: this.objectSubType,
						groupID: this.groupID,
						stroke: this.stroke,
						fill: this.fill,
						perPixelTargetFind: this.perPixelTargetFind
					});
			}
		};
	})(fabric.Object.prototype.toObject);

	var editorController = {
		// Rectangle
		rect: {
			onMouseDown: function(){
				var rect = new fabric.Rect({
					width: 0,
					height: 0,
					strokeWidth: this.globalSize * 1.5,
					fill: 'transparent',
					stroke: this.globalColor,
					left: this.startX,
					top: this.startY,
					selectable: true,
					perPixelTargetFind: true
				});

				rect.objectType = 'rect';

				this.activeObject = rect;
				this.canvas.add(rect);

				mb_create_element = true;
			},
			onMouseMove: function(){
				if(!this.activeObject) return;

				var points = Math_helper.upperAndLowerOfTwoPoints(this.startX, this.startY, this.x2, this.y2);

				var w = points.upper.x - points.lower.x;
				var h = points.upper.y - points.lower.y;

				this.activeObject.set({
					top: points.lower.y,
					left: points.lower.x,
					width: w,
					height: h
				});
			},
			onMouseUp: function(){
				if(!this.activeObject) return;

				if(
					Math.abs(this.activeObject.width) < 2
					|| Math.abs(this.activeObject.height) < 2
				){
					this.canvas.remove(this.activeObject);
					return;
				}
			},
			onScaling: function(e){
				var obj = e.target;

				var w = obj.width * obj.scaleX,
				h = obj.height * obj.scaleY;

				obj.set({
					height: h,
					width: w,
					scaleX: 1,
					scaleY: 1
				});
			},
			onColorChange: function(obj, newValue){
				obj.set({
					stroke: newValue
				});
				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				// newValue = newValue * 1.5;

				if(newValue > obj.strokeWidth){
					obj.set({
						strokeWidth: newValue,
						// width: obj.width - newValue,
						// height: obj.height - newValue
					});
				} else {
					obj.set({
						strokeWidth: newValue,
						// width: obj.width + newValue,
						// height: obj.height + newValue
					});
				}

				this.canvas.renderAll();
			}
		},

		// Ellipse
		ellipse: {
			onMouseDown: function(){
				var ellipse = new fabric.Ellipse({
					rx: 0,
					ry: 0,
					strokeWidth: this.globalSize * 1.5,
					fill: 'transparent',
					stroke: this.globalColor,
					left: this.startX,
					top: this.startY,
					selectable: true,
					perPixelTargetFind: true
				});

				ellipse.objectType = 'ellipse';

				this.activeObject = ellipse;
				this.canvas.add(ellipse);

				mb_create_element = true;
			},
			onMouseMove: function(){
				if(!this.activeObject) return;

				var points = Math_helper.upperAndLowerOfTwoPoints(this.startX, this.startY, this.x2, this.y2);

				var rx = (points.upper.x - points.lower.x) / 2;
				var ry = (points.upper.y - points.lower.y) / 2;

				this.activeObject.set({
					left: points.lower.x,
					top: points.lower.y,
					rx: rx,
					ry: ry
				});
			},
			onMouseUp: function(){
				if(!this.activeObject) return;

				if(
					Math.abs(this.activeObject.width) < 2
					|| Math.abs(this.activeObject.height) < 2
				){
					this.canvas.remove(this.activeObject);
					return;
				}
			},
			onScaling: function(e){
				var obj = e.target,
					w = obj.rx * obj.scaleX,
					h = obj.ry * obj.scaleY;

				obj.set({
					ry: h,
					rx: w,
					scaleX: 1,
					scaleY: 1
				});
			},
			onColorChange: function(obj, newValue){
				obj.set({
					stroke: newValue
				});
				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				// newValue = newValue * 1.5;

				if(newValue > obj.strokeWidth){
					obj.set({
						strokeWidth: newValue,
						// rx: obj.rx - newValue,
						// ry: obj.ry - newValue
					});
				} else {
					obj.set({
						strokeWidth: newValue,
						// rx: obj.rx + newValue,
						// ry: obj.ry + newValue
					});
				}

				this.canvas.renderAll();
			}
		},

		// Line
		line: {
			onMouseDown: function(){
				var line = new fabric.Rect({
					width: 0,
					height: 0,
					strokeWidth: this.globalSize,
					fill: 'transparent',
					stroke: this.globalColor,
					left: this.startX,
					top: this.startY,
					selectable: true,
					lockScalingY: true,
					perPixelTargetFind: true
				});

				line.objectType = 'line';

				line._controlOpt = {
					'tl': false,
					'tr': false,
					'bl': false,
					'br': false,
					'mt': false,
					'mb': false
				};

				line.setControlsVisibility(line._controlOpt);

				this.activeObject = line;
				this.canvas.add(line);

				mb_create_element = true;
			},
			onMouseMove: function(){
				if(!this.activeObject) return;

				this.activeObject.set({
					width: Math_helper.lineLength(this.startX, this.startY, this.x2, this.y2),
					height: 0,
					angle: Math_helper.getAngleInDegrees(this.startX, this.startY, this.x2, this.y2)
				});
			},
			onMouseUp: function(){
				if(!this.activeObject) return;

				if(
					Math.abs(this.activeObject.width) < 2
				){
					this.canvas.remove(this.activeObject);
					return;
				}
			},
			onScaling: function(e){
				var obj = e.target,
					w = obj.width * obj.scaleX,
					h = obj.height * obj.scaleY;

				obj.set({
					height: h,
					width: w,
					scaleX: 1,
					scaleY: 1
				});
			},
			onColorChange: function(obj, newValue){
				obj.set({
					stroke: newValue
				});
				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				obj.set({
					strokeWidth: newValue
				});

				this.canvas.renderAll();
			}
		},

		// Brush
		brush: {
			onActive: function(){
				this.canvas.freeDrawingBrush.color = this.globalColor;
				this.canvas.freeDrawingBrush.width = this.globalSize;
				this.canvas.freeDrawingBrush.shadowBlur = 0;
				this.canvas.isDrawingMode = true;

				mb_create_element = true;
			},
			onColorChange: function(){
				this.canvas.freeDrawingBrush.color = this.globalColor;
				mb_create_element = true;
			},
			onSizeChange: function(){
				this.canvas.freeDrawingBrush.width = this.globalSize;
			},
			onNotActive: function(){
				this.canvas.isDrawingMode = false;
			}
		},

		// Text
		text: {
			onMouseDown: function(){
				if(!this.currentAction) return;

				var self = editorController[this.currentAction];

				var text = new fabric.IText('Enter Text Here', {
					left: this.startX,
					top: this.startY,
					fontFamily: 'helvetica',
					angle: 0,
					fill: this.globalColor,
					scaleX: 0.5,
					scaleY: 0.5,
					fontWeight: '',
					originX: 'left',
					fontSize: this.globalSize * 20 + 7,
					hasRotatingPoint: true,
					centerTransform: true,
					textAlign: 'center',
					
					selectable: true,
					hasControls: true,
					lockScalingX: false,
					lockScalingY: false,
					lockRotation: false,
					perPixelTargetFind: false
				});

				text.objectType = 'text';

				this.activeObject = text;
				this.canvas.add(text);

				mb_create_element = true;
			},
			onMouseUp: function(e){
				if(!this.activeObject) return;

				var object = this.activeObject;
				this.canvas.setActiveObject(object);
				object.enterEditing();
				object.selectAll();
				this.canvas.renderAll();
			},
			onColorChange: function(obj, newValue){
				obj.set({
					fill: newValue
				});
				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				obj.set({
					fontSize: newValue * 20 + 7
				});

				this.canvas.renderAll();
			}
		},

		// lineArrow
		lineArrow: {
			lineCount: 0,

			onMouseDown: function(){
				if(!this.currentAction) return;

				var self = editorController[this.currentAction];

				var base = new fabric.Circle({
					left: this.startX,
					top: this.startY,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: 2,
					selectable: true,
					radius: (this.globalSize * 1) + 5,
					originX: 'center',
					originY: 'center',
					lockScalingX: true,
					lockScalingY: true,
					padding: 1,
					perPixelTargetFind: true
				});
				base.objectType = 'lineArrow';
				base.objectSubType = 'base';

				var angle = Math_helper.getAngleInDegrees(this.startX, this.startY, this.startX, this.startY);

				var arrow = new fabric.Triangle({
					left: this.startX,
					top: this.startY,
					width: (this.globalSize * 3) + 15,
					height: (this.globalSize * 3) + 15,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: 2,
					angle: angle + 90,
					originX: 'center',
					originY: 'center',
					lockScalingX: true,
					lockScalingY: true,
					padding: 1,
					perPixelTargetFind: true
				});
				arrow.objectType = 'lineArrow';
				arrow.objectSubType = 'arrow';

				var line = new fabric.Rect({
					left: this.startX,
					top: this.startY,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: this.globalSize,
					selectable: true,
					width: Math_helper.lineLength(this.startX, this.startY, this.startX, this.startY),
					angle: angle,
					originY: 'center',
					height: 1,
					padding: 3,
					perPixelTargetFind: true
				});
				line.objectType = 'lineArrow';
				line.objectSubType = 'line';

				arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
				arrow.hasControls = false;
				base.lockScalingX = base.lockScalingY = base.lockRotation = true;
				base.hasControls = false;
				line.lockScalingX = line.lockScalingY = line.lockRotation = true;
				line.hasControls = false;

				base.groupID = self.lineCount;
				arrow.groupID = self.lineCount;
				line.groupID = self.lineCount;

				self.lineCount++;

				base.arrow = arrow;
				base.line = line;
				arrow.base = base;
				arrow.line = line;
				line.base = base;
				line.arrow = arrow;

				this.canvas.add(base);
				this.canvas.add(arrow);
				this.canvas.add(line);

				this.activeObject = arrow;

				mb_create_element = true;
			},
			onMouseMove: function(){
				if(!this.activeObject) return;

				var angle = Math_helper.getAngleInDegrees(this.startX, this.startY, this.x2, this.y2);

				var arrow = this.activeObject;
				var base = this.activeObject.base;
				var line = this.activeObject.line;

				arrow.set({
					left: this.x2,
					top: this.y2,
					angle: angle + 90
				});

				line.set({
					width: Math_helper.lineLength(this.startX, this.startY, this.x2, this.y2),
					angle: angle
				});

				this.canvas.renderAll();

				this.canvas.bringToFront(line);
				this.canvas.bringToFront(arrow);
				this.canvas.bringToFront(base);
			},
			onMouseUp: function(){
				if(!this.activeObject) return;

				var main_obj = this.activeObject.arrow ? this.activeObject.arrow : this.activeObject;

				if(
					Math.abs(main_obj.line.width) < 2
				){
					this.canvas.remove(main_obj.line);
					this.canvas.remove(main_obj.base);
					this.canvas.remove(main_obj);
					return;
				}

				var arrow = main_obj;
				var base = main_obj.base;
				var line = main_obj.line;

				arrow.setCoords();
				base.setCoords();
				line.setCoords();
			},
			onMoving: function(e){
				var object = e.target;
				var x = object.left;
				var y = object.top;

				switch(object.objectSubType){
					case 'line':
						var arrow = object.arrow;
						var base = object.base;
						var line = object;

						base.set({ left: x, top: y });

						var x2 = line.left + (line.width * Math.cos(line.angle * (Math.PI / 180)));
						var y2 = line.top + (line.width * Math.sin(line.angle * (Math.PI / 180)));

						arrow.set({ left: x2, top: y2 });

						base.setCoords();
						arrow.setCoords();
						break;

					case 'base':
						var arrow = object.arrow;
						var line = object.line;
						var base = object;

						var angle = Math_helper.getAngleInDegrees(x, y, arrow.left, arrow.top);

						line.set({
							left: x,
							top: y,
							angle: angle,
							width: Math_helper.lineLength(x, y, arrow.left, arrow.top)
						});

						arrow.set({ angle: angle + 90 });

						line.setCoords();
						arrow.setCoords();
						break;

					case 'arrow':
						var arrow = object;
						var line = object.line;
						var base = object.base;

						var angle = Math_helper.getAngleInDegrees(base.left, base.top, x, y);

						line.set({
							angle: angle,
							width: Math_helper.lineLength(base.left, base.top, x, y)
						});

						arrow.set({ angle: angle + 90 });

						line.setCoords();
						arrow.setCoords();
						break;
				}
			},
			onColorChange: function(obj, newValue){
				var main_obj = obj.arrow ? obj.arrow : obj;

				var arrow = main_obj;
				var line = main_obj.line;
				var base = main_obj.base;

				arrow.set({
					stroke: newValue,
					fill: newValue
				});

				line.set({
					stroke: newValue,
					fill: newValue
				});

				base.set({
					stroke: newValue,
					fill: newValue
				});

				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				var main_obj = obj.arrow ? obj.arrow : obj;

				var arrow = main_obj;
				var line = main_obj.line;
				var base = main_obj.base;
				
				arrow.set({
					width: (newValue * 3) + 15,
					height: (newValue * 3) + 15
				});

				line.set({
					strokeWidth: newValue
				});

				base.set({
					radius: newValue + 5
				});

				this.canvas.renderAll();
			}
		},

		// lineArrowText
		lineArrowText: {
			lineCount: 0,

			textOffset_x: 10,
			textOffset_y: 10,
			textMoving: false,

			onMouseDown: function(){
				if(!this.currentAction) return;

				var self = editorController[this.currentAction];

				var base = new fabric.Circle({
					left: this.startX,
					top: this.startY,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: 2,
					selectable: true,
					radius: (this.globalSize * 1) + 5,
					originX: 'center',
					originY: 'center',
					lockScalingX: true,
					lockScalingY: true,
					padding: 1,
					perPixelTargetFind: true
				});
				base.objectType = 'lineArrowText';
				base.objectSubType = 'base';

				var angle = Math_helper.getAngleInDegrees(this.startX, this.startY, this.startX, this.startY);

				var arrow = new fabric.Triangle({
					left: this.startX,
					top: this.startY,
					width: (this.globalSize * 3) + 15,
					height: (this.globalSize * 3) + 15,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: 2,
					angle: angle + 90,
					originX: 'center',
					originY: 'center',
					lockScalingX: true,
					lockScalingY: true,
					padding: 1,
					perPixelTargetFind: true
				});
				arrow.objectType = 'lineArrowText';
				arrow.objectSubType = 'arrow';

				var line = new fabric.Rect({
					left: this.startX,
					top: this.startY,
					stroke: this.globalColor,
					fill: this.globalColor,
					strokeWidth: this.globalSize,
					selectable: true,
					width: Math_helper.lineLength(this.startX, this.startY, this.startX, this.startY),
					angle: angle,
					originY: 'center',
					height: 1,
					padding: 3,
					perPixelTargetFind: true
				});
				line.objectType = 'lineArrowText';
				line.objectSubType = 'line';

				var text_pos = Math_helper.getTextPosition(this.startX, this.startY, this.startX, this.startY);

				var text = new fabric.IText('Enter \nText Here', {
					left: (text_pos.originX == 'right') ? this.startX - self.textOffset_x : this.startX + self.textOffset_x,
					top: (text_pos.originY == 'bottom') ? this.startY - self.textOffset_y : this.startY + self.textOffset_y,
					fontFamily: 'helvetica',
					angle: 0,
					fill: this.globalColor,
					scaleX: 0.5,
					scaleY: 0.5,
					fontWeight: '',
					fontSize: (this.globalSize * 20) + 5,
					originX: text_pos.originX,
					originY: text_pos.originY,
					hasRotatingPoint: true,
					centerTransform: true,
					zindex: 10,
					textAlign: 'center',
					perPixelTargetFind: false
				});

				text.textOffset_x = self.textOffset_x;
				text.textOffset_y = self.textOffset_y;
				text.old_left = text.left;
				text.old_top = text.top;
				
				text.objectType = 'lineArrowText';
				text.objectSubType = 'text';

				arrow.lockScalingX = arrow.lockScalingY = arrow.lockRotation = true;
				arrow.hasControls = false;
				base.lockScalingX = base.lockScalingY = base.lockRotation = true;
				base.hasControls = false;
				line.lockScalingX = line.lockScalingY = line.lockRotation = true;
				line.hasControls = false;

				base.groupID = self.lineCount;
				arrow.groupID = self.lineCount;
				line.groupID = self.lineCount;
				text.groupID = self.lineCount;

				self.lineCount++;

				base.arrow = arrow;
				base.line = line;
				base.text = text;
				arrow.base = base;
				arrow.line = line;
				arrow.text = text;
				line.base = base;
				line.arrow = arrow;
				line.text = text;
				text.base = base;
				text.arrow = arrow;
				text.line = line;

				this.canvas.add(base);
				this.canvas.add(arrow);
				this.canvas.add(line);
				this.canvas.add(text);

				this.activeObject = arrow;

				mb_create_element = true;
			},
			onMouseMove: function(){
				if(!this.activeObject) return;

				var angle = Math_helper.getAngleInDegrees(this.startX, this.startY, this.x2, this.y2);
				var text_pos = Math_helper.getTextPosition(this.startX, this.startY, this.x2, this.y2);

				var arrow = this.activeObject;
				var base = this.activeObject.base;
				var line = this.activeObject.line;
				var text = this.activeObject.text;

				arrow.set({
					left: this.x2,
					top: this.y2,
					angle: angle + 90
				});

				line.set({
					width: Math_helper.lineLength(this.startX, this.startY, this.x2, this.y2),
					angle: angle
				});

				text.set({
					left: (text_pos.originX == 'right') ? this.startX - text.textOffset_x : this.startX + text.textOffset_x,
					top: (text_pos.originY == 'bottom') ? this.startY - text.textOffset_y : this.startY + text.textOffset_y,
					originX: text_pos.originX,
					originY: text_pos.originY
				});
				text.old_left = text.left;
				text.old_top = text.top;

				this.canvas.renderAll();

				this.canvas.bringToFront(line);
				this.canvas.bringToFront(text);
				this.canvas.bringToFront(arrow);
				this.canvas.bringToFront(base);
			},
			onMouseUp: function(){
				if(!this.activeObject || !this.currentAction) return;

				var self = editorController[this.currentAction];

				var main_obj = this.activeObject.arrow ? this.activeObject.arrow : this.activeObject;

				if(
					Math.abs(main_obj.line.width) < 2
				){
					this.canvas.remove(main_obj.line);
					this.canvas.remove(main_obj.text);
					this.canvas.remove(main_obj.base);
					this.canvas.remove(main_obj);
					return;
				}

				var arrow = main_obj;
				var base = main_obj.base;
				var line = main_obj.line;
				var text = main_obj.text;

				arrow.setCoords();
				base.setCoords();
				line.setCoords();

				this.canvas.setActiveObject(text);
				text.enterEditing();
				text.selectAll();
				this.canvas.renderAll();

				if(self.textMoving){
					var text = main_obj;
					
					self.textMoving = false;

					// text.textOffset_x = text.left - text.old_left;
					// text.textOffset_y = text.top - text.old_top;

					text.old_left = text.left;
					text.old_top = text.top;
				}
			},
			onMoving: function(e){
				var object = e.target;
				var x = object.left;
				var y = object.top;

				var self = editorController[object.objectType];

				switch(object.objectSubType){
					case 'line':
						var arrow = object.arrow;
						var base = object.base;
						var line = object;
						var text = object.text;

						base.set({ left: x, top: y });

						var x2 = line.left + (line.width * Math.cos(line.angle * (Math.PI / 180)));
						var y2 = line.top + (line.width * Math.sin(line.angle * (Math.PI / 180)));

						var text_pos = Math_helper.getTextPosition(line.left, line.top, x2, y2);

						arrow.set({ left: x2, top: y2 });

						text.set({
							left: (text_pos.originX == 'right') ? base.left - text.textOffset_x : base.left + text.textOffset_x,
							top: (text_pos.originX == 'bottom') ? base.top - text.textOffset_y : base.top + text.textOffset_y,
							originX: text_pos.originX,
							originY: text_pos.originY
						});
						text.old_left = text.left;
						text.old_top = text.top;

						base.setCoords();
						arrow.setCoords();
						text.setCoords();
						break;

					case 'base':
						var arrow = object.arrow;
						var line = object.line;
						var base = object;
						var text = object.text;

						var angle = Math_helper.getAngleInDegrees(x, y, arrow.left, arrow.top);
						var text_pos = Math_helper.getTextPosition(x, y, arrow.left, arrow.top);

						line.set({
							left: x,
							top: y,
							angle: angle,
							width: Math_helper.lineLength(x, y, arrow.left, arrow.top)
						});

						arrow.set({ angle: angle + 90 });

						text.set({
							left: (text_pos.originX == 'right') ? x - text.textOffset_x : x + text.textOffset_x,
							top: (text_pos.originX == 'bottom') ? y - text.textOffset_y : y + text.textOffset_y,
							originX: text_pos.originX,
							originY: text_pos.originY
						});
						text.old_left = text.left;
						text.old_top = text.top;

						line.setCoords();
						arrow.setCoords();
						text.setCoords();
						break;

					case 'arrow':
						var arrow = object;
						var line = object.line;
						var base = object.base;
						var text = object.text;

						var angle = Math_helper.getAngleInDegrees(base.left, base.top, x, y);
						var text_pos = Math_helper.getTextPosition(base.left, base.top, x, y);

						line.set({
							angle: angle,
							width: Math_helper.lineLength(base.left, base.top, x, y)
						});

						arrow.set({ angle: angle + 90 });

						text.set({
							left: (text_pos.originX == 'right') ? base.left - text.textOffset_x : base.left + text.textOffset_x,
							top: (text_pos.originX == 'bottom') ? base.top - text.textOffset_y : base.top + text.textOffset_y,
							originX: text_pos.originX,
							originY: text_pos.originY
						});
						text.old_left = text.left;
						text.old_top = text.top;

						line.setCoords();
						arrow.setCoords();
						text.setCoords();
						break;

					case 'text':
						var text = object;
						var arrow = object.arrow;
						var base = object.base;
						var line = object.line;

						self.textMoving = true;

						base.setCoords();
						arrow.setCoords();
						text.setCoords();
						break;
				}
			},
			onColorChange: function(obj, newValue){
				var main_obj = obj.arrow ? obj.arrow : obj;

				var arrow = main_obj;
				var line = main_obj.line;
				var base = main_obj.base;
				var text = main_obj.text;

				arrow.set({
					stroke: newValue,
					fill: newValue
				});

				line.set({
					stroke: newValue,
					fill: newValue
				});

				base.set({
					stroke: newValue,
					fill: newValue
				});

				text.set({
					fill: newValue
				});

				this.canvas.renderAll();
			},
			onSizeChange: function(obj, newValue){
				var main_obj = obj.arrow ? obj.arrow : obj;

				var arrow = main_obj;
				var line = main_obj.line;
				var base = main_obj.base;
				var text = main_obj.text;
				
				arrow.set({
					width: (newValue * 3) + 15,
					height: (newValue * 3) + 15
				});

				line.set({
					strokeWidth: newValue
				});

				base.set({
					radius: newValue + 5
				});

				text.set({
					fontSize: newValue * 20 + 5
				});

				this.canvas.renderAll();
			}
		},

		// History undo
		undo: {
			onActive: function(e){
				this.currentAction = null;

				var el = $(e.currentTarget);
				el.removeClass('active');

				this.undo();
			}
		},
		// History redo
		redo: {
			onActive: function(e){
				this.currentAction = null;

				var el = $(e.currentTarget);
				el.removeClass('active');

				this.redo();
			}
		}
	};

	var ImageEditor = function(el){
		el = $(el)[0];
		
		var self = this;
		this.el = el;

		var img_url = $(el).attr('data-img');

		$(el).html('<div class="editor-image"></div>\
			<div class="editor-toolbar"></div>');

		var buttons = [
			{ buttonClass: 'undo-icon', action: 'undo' },
			{ buttonClass: 'redo-icon', action: 'redo' },
			{ buttonClass: 'rect-icon', action: 'rect' },
			{ buttonClass: 'ellipse-icon', action: 'ellipse' },
			{ buttonClass: 'line-icon', action: 'line' },
			{ buttonClass: 'brush-icon', action: 'brush' },
			{ buttonClass: 'lineArrow-icon', action: 'lineArrow' },
			{ buttonClass: 'text-icon', action: 'text' },
			{ buttonClass: 'lineArrowText-icon', action: 'lineArrowText' }
		];

		buttons.forEach(function(item){
			$('.editor-toolbar', el).append(createButton(item.buttonClass, item.action));
		});

		$('.editor-toolbar', el).on('click', 'button', this.onActionClick.bind(this));

		$('.editor-toolbar', el).append('<div class="color_wrap"><input id="color1" type="text" name="color1" value="#ff0000" /></div>');
		$('#color1').colorPicker({
			onColorChange: self.onColorChange.bind(self)
		});

		$('.editor-toolbar', el).append('<div class="size_wrap">\
			<span class="glyphicon glyphicon-minus set-size minus-size"></span>\
				<input type="text" id="size1" value="2">\
			<span class="glyphicon glyphicon-plus set-size plus-size"></span>\
		</div>');
		$('#size1').simpleSlider({
			range: [1,20],
			step: 1
		}).on('slider:changed', self.onSizeChange.bind(self));
		$('.size_wrap .minus-size').on('click', function(){
			var el = $('#size1');
			var v = parseInt(el.val());
			if(v > 1) el.simpleSlider('setValue', v - 1);
		});
		$('.size_wrap .plus-size').on('click', function(){
			var el = $('#size1');
			var v = parseInt(el.val());
			if(v < 20) el.simpleSlider('setValue', v + 1);
		});

		var img = new Image();
		img.setAttribute('crossOrigin', 'anonymous');
		img.src = img_url;

		this.canvas = null;

		img.onload = function(){
			var canvasEl = document.createElement('canvas');
			$('.editor-image', el).append(canvasEl);
			self.canvas = new fabric.Canvas(canvasEl);

			var w = $(el).width();
			var k = this.width / w;

			self.canvas.setWidth(w);
			self.canvas.setHeight(this.height / k);

			var _this = this;
			$(window).resize(function(){
				// debugger;
				var w = $(el).width();
				var k = _this.width / w;
				self.canvas.setWidth(w);
				self.canvas.setHeight( parseInt(_this.height / k) );

				self.canvas.backgroundImage.setWidth(w);
				self.canvas.backgroundImage.setHeight(parseInt(_this.height / k));
				self.canvas.renderAll();
			});

			self.canvas.backgroundColor = 'transparent';

			self.canvas.backgroundImage = new fabric.Image(this, {
				top: 0,
				left: 0,
				width: w,
				height: parseInt(this.height / k)
			});

			self.canvas.renderAll();
			self.canvas.uniScaleTransform = true;
			self.canvas.allowTouchScrolling = true;

			self.canvas.on('mouse:down', self.onMouseDown.bind(self));
			self.canvas.on('mouse:up', self.onMouseUp.bind(self));
			self.canvas.on('mouse:move', self.onMouseMove.bind(self));
			self.canvas.on('object:moving', self.onMoving.bind(self));
			self.canvas.on('object:modified', self.onModified.bind(self));
			self.canvas.on('object:scaling', self.onScaling.bind(self));
			self.canvas.on('object:selected', self.onSelected.bind(self));
			self.canvas.on('selection:cleared', self.onUnSelected.bind(self));

			if(self.oninit) self.oninit.bind(self)();

			self.historyAdd();
		};

		$(document).on('keyup', function(e){
			switch(e.keyCode){
				case 46:
					var obj = self.canvas.getActiveObject();
					if(obj.objectType == 'lineArrow' || obj.objectType == 'lineArrowText'){
						if(obj.arrow) self.canvas.remove(obj.arrow);
						if(obj.line) self.canvas.remove(obj.line);
						if(obj.base) self.canvas.remove(obj.base);
						if(obj.text) self.canvas.remove(obj.text);
					}
					
					self.canvas.remove(obj);

					break;
				case 89:
					if(e.ctrlKey){
						self.redo();
					}
					break;
				case 90:
					if(e.ctrlKey){
						self.undo();
					}
					break;
			}
		});

		this.globalColor = '#ff0000';
		this.globalSize = 2;
		this.currentAction = null;
		this.activeObject = null;
		this.startX = null;
		this.startY = null;
		this.x2 = null;
		this.y2 = null;

		this.history_store = [];
		this.history_index = -1;
		this.history_in_process = false;
	};

	ImageEditor.prototype.close = function(){
		$(this.el).html('');
	};

	ImageEditor.prototype.undo = function(){
		var self = this;

		if(this.history_index <= 0 || this.history_in_process) return;
		this.history_in_process = true;

		this.history_index--;
		var hist_data = this.history_store[this.history_index];

		this.canvas.loadFromJSON(JSON.stringify(hist_data), function(){
			self.afterLoading();
			self.canvas.renderAll();
			self.history_in_process = false;
		});

		this.historyControlStatus();
	};

	ImageEditor.prototype.redo = function(){
		var self = this;

		if(this.history_index >= this.history_store.length - 1 || this.history_in_process) return;
		this.history_in_process = true;

		this.history_index++;
		var hist_data = this.history_store[this.history_index];

		this.canvas.loadFromJSON(JSON.stringify(hist_data), function(){
			self.afterLoading();
			self.canvas.renderAll();
			self.history_in_process = false;
		});

		this.historyControlStatus();
	};

	ImageEditor.prototype.afterLoading = function(){
		var objs = this.canvas._objects;

		objs.forEach(function(obj1){
			if(obj1.objectType == 'lineArrow' || obj1.objectType == 'lineArrowText'){
				objs.forEach(function(obj2){
					if(
						obj1.objectType == obj2.objectType
						&& obj1.groupID == obj2.groupID
						&& obj1 != obj2
					){
						obj2[obj1.objectSubType] = obj1;
					}
				});
				if(obj1._controlOpt){
					obj1.setControlsVisibility(obj1._controlOpt);
				}
			}
		});
	};

	ImageEditor.prototype.historyAdd = function(){
		var canvas_data = this.canvas.toObject();

		if(this.history_index == this.history_store.length - 1){
			this.history_index = this.history_store.push(canvas_data) - 1;
		} else {
			this.history_store
				.splice(this.history_index + 1, this.history_store.length - (this.history_index + 1));
			this.history_index = this.history_store.push(canvas_data) - 1;
		}
	};

	ImageEditor.prototype.historyControlStatus = function(){
		if(this.history_index > 0){
			$('.editor-toolbar .undo-icon', this.el)
				.parent().addClass('enable');
		} else {
			$('.editor-toolbar .undo-icon', this.el)
				.parent().removeClass('enable');
		}

		if(this.history_index < this.history_store.length - 1){
			$('.editor-toolbar .redo-icon', this.el)
				.parent().addClass('enable');
		} else {
			$('.editor-toolbar .redo-icon', this.el)
				.parent().removeClass('enable');
		}
	};

	ImageEditor.prototype.onActionClick = function(e){
		var el = $(e.currentTarget);
		var action = el.attr('data-action');
		var currentActive = el.hasClass('active');

		if(action){
			$('.editor-toolbar button', this.el).removeClass('active');

			if(this.currentAction != action && !currentActive){
				if(this.currentAction){
					if(editorController[this.currentAction]
						&& editorController[this.currentAction].onNotActive
					) editorController[this.currentAction].onNotActive.apply(this, [e]);
				}

				el.addClass('active');
				this.currentAction = action;

				this.canvas.allowTouchScrolling = false;

				if(editorController[this.currentAction]
					&& editorController[this.currentAction].onActive
				) editorController[this.currentAction].onActive.apply(this, [e]);
			} else {
				this.canvas.allowTouchScrolling = true;

				if(editorController[this.currentAction]
					&& editorController[this.currentAction].onNotActive
				) editorController[this.currentAction].onNotActive.apply(this, [e]);

				this.currentAction = null;
			}
		}
	};

	ImageEditor.prototype.onColorChange = function(id, newValue){
		this.globalColor = newValue;

		var obj = this.canvas.getActiveObject();

		if(obj
			&& editorController[obj.objectType]
			&& editorController[obj.objectType].onColorChange
		) editorController[obj.objectType].onColorChange.apply(this, [obj, newValue]);

		if(this.canvas.isDrawingMode){
			editorController['brush'].onColorChange.apply(this);
		}

		if(obj || this.canvas.isDrawingMode){
			this.historyAdd();
			this.historyControlStatus();
		}
	};

	ImageEditor.prototype.onSizeChange = function(e){
		this.globalSize = Number(e.target.value);

		var obj = this.canvas.getActiveObject();

		if(obj
			&& editorController[obj.objectType]
			&& editorController[obj.objectType].onSizeChange
		) editorController[obj.objectType].onSizeChange.apply(this, [obj, this.globalSize]);

		if(this.canvas.isDrawingMode){
			editorController['brush'].onSizeChange.apply(this);
		}

		if(obj && !this.canvas.isDrawingMode){
			this.historyAdd();
			this.historyControlStatus();
		}
	};

	ImageEditor.prototype.onMouseDown = function(e){
		if(!this.currentAction) return;

		this.canvas.calcOffset();
		var pointer = this.canvas.getPointer(e.e);
		var x = pointer.x;
		var y = pointer.y;
		var point = new fabric.Point(x, y);

		var activeObject = this.canvas.getActiveObject();
		if (activeObject) {
			return;
		}

		this.startX = x;
		this.startY = y;
		
		this.canvas.discardActiveObject();

		if(editorController[this.currentAction]
			&& editorController[this.currentAction].onMouseDown
		) editorController[this.currentAction].onMouseDown.apply(this, [e]);
	};

	ImageEditor.prototype.onMouseMove = function(e){
		if(!this.currentAction || this.startX === null || this.startY === null) return;

		var pointer = this.canvas.getPointer(e.e);
		var x = pointer.x;
		var y = pointer.y;

		this.x2 = x;
		this.y2 = y;

		if(editorController[this.currentAction]
			&& editorController[this.currentAction].onMouseMove
		) editorController[this.currentAction].onMouseMove.apply(this, [e]);

		if(this.activeObject){
			this.canvas.renderAll();
			this.canvas.bringToFront(this.activeObject);
		}
	};

	var mb_create_element = false;

	ImageEditor.prototype.onMouseUp = function(e){
		this.startX = null;
		this.startY = null;

		if(this.activeObject){
			this.canvas.deactivateAll();
			this.canvas.setActiveObject(this.activeObject);
			this.canvas.renderAll();
			this.canvas.calcOffset();

			this.activeObject.setCoords();
		}

		if(editorController[this.currentAction]
			&& editorController[this.currentAction].onMouseUp
		) editorController[this.currentAction].onMouseUp.apply(this, [e]);

		var obj = this.canvas.getActiveObject();

		if(obj || this.canvas.isDrawingMode){
			if(mb_create_element){
				this.historyAdd();
				this.historyControlStatus();
			}
		}

		mb_create_element = false;

		this.activeObject = null;
	};

	ImageEditor.prototype.onMoving = function(e){
		var obj = e.target;

		if(editorController[obj.objectType]
			&& editorController[obj.objectType].onMoving
		) editorController[obj.objectType].onMoving.apply(this, [e]);
	};

	ImageEditor.prototype.onModified = function(){
		this.historyAdd();
		this.historyControlStatus();
	};

	ImageEditor.prototype.onScaling = function(e){
		var obj = e.target;

		if(editorController[obj.objectType]
			&& editorController[obj.objectType].onScaling
		){
			editorController[obj.objectType].onScaling.apply(this, [e]);
		}
	};

	ImageEditor.prototype.onSelected = function(e){
		var obj = e.target;
		// todo
	};

	ImageEditor.prototype.onUnSelected = function(e){
		this.activeObject = null;
	};

	window.ImageEditor = ImageEditor;
})(window, jQuery, fabric);