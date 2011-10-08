/*!
 * SwipeView v0.1 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
var SwipeView = (function(){
	var hasTouch = 'ontouchstart' in window,
		resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize',
		startEvent = hasTouch ? 'touchstart' : 'mousedown',
		moveEvent = hasTouch ? 'touchmove' : 'mousemove',
		endEvent = hasTouch ? 'touchend' : 'mouseup',
		cancelEvent = hasTouch ? 'touchcancel' : 'mouseup',
		
//		isImage = function (value) { return /.(jpg|jpeg|png|gif|svg|pdf)(\?.*)?$/.test(value); },

		SwipeView = function (el, options) {
			var i,
				div,
				img,
				image;

			this.wrapper = document.querySelector(el);
			this.options = {
				pages: [],
				snapThreshold: 80
			}
		
			// User defined options
			for (i in options) this.options[i] = options[i];
			
			this.wrapper.style.overflow = 'hidden';
			this.wrapper.style.position = 'relative';
			
			div = document.createElement('div');
			div.style.cssText = 'position:relative;top:0;height:100%;width:100%;-webkit-transition-duration:0;-webkit-transform:translate3d(0,0,0);-webkit-transition-timining-function:ease-out';
			this.wrapper.appendChild(div);
			this.slider = div;

			this.refreshSize();

			for (i=-1; i<2; i++) {
				div = document.createElement('div');
				div.style.cssText = '-webkit-transform:translateZ(0);position:absolute;top:0;height:100%;width:100%;left:' + i*100 + '%';
				image = i==-1 ? this.options.pages.length-1 : i;
				img = document.createElement('img');
				img.src = this.options.pages[image].source;
				img.width = this.options.pages[image].width;
				img.height = this.options.pages[image].height;
//				img.style.marginLeft = -Math.round(this.options.pages[image].width / 2) + 'px';
//				img.style.marginTop = -Math.round(this.options.pages[image].height / 2) + 'px';
				
				div.appendChild(img);
//				div.innerHTML = '<img src="' + this.options.pages[image].source + '" width="' + this.options.pages[image].width + '" height="' + this.options.pages[image].height + '" alt="pic">';
				this.slider.appendChild(div);
				this.masterPages.push(div);
			}

			window.addEventListener(resizeEvent, this, false);
			this.wrapper.addEventListener(startEvent, this, false);
			this.wrapper.addEventListener(moveEvent, this, false);
			this.wrapper.addEventListener(endEvent, this, false);
			this.slider.addEventListener('webkitTransitionEnd', this, false);

			if (!hasTouch) {
				this.wrapper.addEventListener('mouseout', this, false);
			}
		};
	
	SwipeView.prototype = {
		masterPages: [],
		x: 0,
		page: 0,
		image: 0,

		handleEvent: function (e) {
			switch (e.type) {
				case startEvent:
					this.__start(e);
					break;
				case moveEvent:
					this.__move(e);
					break;
				case cancelEvent:
				case endEvent:
					this.__end(e);
					break;
				case resizeEvent:
				 	this.__resize();
					break;
				case 'webkitTransitionEnd':
					this.__flip();
					break;
			}
		},
		
		refreshSize: function () {
			this.wrapperWidth = this.wrapper.clientWidth;
			this.wrapperHeight = this.wrapper.clientHeight;
			this.pageWidth = this.wrapperWidth;
			this.maxX = -2 * this.pageWidth + this.wrapperWidth;
		},
		
		__pos: function (x) {
			this.x = x;
			this.slider.style.webkitTransform = 'translate3d(' + x + 'px,0,0)';
		},

		__resize: function () {
			this.refreshSize();
			this.slider.style.webkitTransitionDuration = '0';
			this.__pos(-this.page * this.pageWidth);
		},

		__start: function (e) {
			e.preventDefault();

			if (this.initiated || this.flipping) return;
			
			var point = hasTouch ? e.touches[0] : e;
			
			this.initiated = true;
			this.moved = false;
			this.startX = point.pageX;
			this.startY = point.pageY;
			this.pointX = point.pageX;
			this.directionX = 0;
			
/*			var matrix = getComputedStyle(this.slider, null).webkitTransform.replace(/[^0-9-.,]/g, '').split(',');
			this.x = matrix[4] * 1;*/

			this.slider.style.webkitTransitionDuration = '0';
		},
		
		__move: function (e) {
			if (!this.initiated) return;

			var point = hasTouch ? e.touches[0] : e,
				deltaX = point.pageX - this.pointX,
				newX = this.x + deltaX;

			this.moved = true;
			this.pointX = point.pageX;
			this.directionX = deltaX > 0 ? 1 : deltaX < 0 ? -1 : 0;

/*			if (newX > 0 || newX < this.maxX) {
				newX = this.x + (deltaX / 2);
			}*/

			this.__pos(newX);
		},
		
		__end: function (e) {
			if (!this.initiated) return;
			
			var point = hasTouch ? e.changedTouches[0] : e,
				newX;

			this.initiated = false;
			
			if (!this.moved) return;

			if (Math.abs(point.pageX - this.startX) < this.options.snapThreshold) {
				this.slider.style.webkitTransitionDuration = '300ms';
				this.__pos(-this.page * this.pageWidth);
				return;
			}

			this.page = this.directionX > 0 ? -Math.ceil(this.x / this.pageWidth) : -Math.floor(this.x / this.pageWidth);
//			this.page = this.page < 0 ? 0 : this.page > 1 ? 1 : this.page;

			this.slider.style.webkitTransitionDuration = '500ms';
			
			newX = -this.page * this.pageWidth;
			this.flipping = true;
			if (this.x == newX) this.__flip();
			else this.__pos(newX);
		},
		
		__flip: function () {
			if (!this.flipping) return;

			var currentMasterPage,
				shiftImage,
				imageEl,
				leftPage,
				rightPage;

			currentMasterPage = (this.page + 1) - Math.floor((this.page + 1) / 3) * 3;
			leftPage = currentMasterPage - 1;
			leftPage = leftPage < 0 ? 2 : leftPage;
			rightPage = currentMasterPage + 1;
			rightPage = rightPage > 2 ? 0 : rightPage;

//			this.masterPages[currentMasterPage].style.left = this.page * 100 + '%';

			shiftImage = this.page - 1;
			shiftImage = shiftImage - Math.floor(shiftImage / this.options.pages.length) * this.options.pages.length;
			this.masterPages[leftPage].style.left = this.page * 100 - 100 + '%';
			imageEl = this.masterPages[leftPage].getElementsByTagName('img')[0];

			if (imageEl.getAttribute('src') != this.options.pages[shiftImage].source) {
				imageEl.src = this.options.pages[shiftImage].source;
				imageEl.width = this.options.pages[shiftImage].width;
				imageEl.height = this.options.pages[shiftImage].height;
			}

			shiftImage = this.page + 1;
			shiftImage = shiftImage - Math.floor(shiftImage / this.options.pages.length) * this.options.pages.length;
			this.masterPages[rightPage].style.left = this.page * 100 + 100 + '%';
			imageEl = this.masterPages[rightPage].getElementsByTagName('img')[0];

			if (imageEl.getAttribute('src') != this.options.pages[shiftImage].source) {
				imageEl.src = this.options.pages[shiftImage].source;
				imageEl.width = this.options.pages[shiftImage].width;
				imageEl.height = this.options.pages[shiftImage].height;
			} 
			
			this.flipping = false;
/*			imageEl.style.marginLeft = -Math.round(this.options.pages[shiftImage].width / 2) + 'px';
			imageEl.style.marginTop = -Math.round(this.options.pages[shiftImage].height / 2) + 'px';*/
		}
	};

	return SwipeView;
})();