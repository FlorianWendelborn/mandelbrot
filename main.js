var canvas, ctx;

var nmin = 0, nmax = 40, xmin = 0, xmax, ymin = 0, ymax, cx=0, cy=0, s=1;

var height, width;

window.onload = function () {
	canvas = document.getElementsByTagName('canvas')[0];
	height = window.innerHeight;
	width = window.innerWidth;
	canvas.width = width;
	canvas.height = height;
	ctx = canvas.getContext('2d');
	render();
}
window.onclick = function (e) {
	s = s*2;
	nmax = nmax*1.2;
	cx = translate(-width/2+2*(e.x||e.pageX),-height/2+2*(e.y||e.pageY))[0];
	cy = translate(-width/2+2*(e.x||e.pageX),-height/2+2*(e.y||e.pageY))[1];
	render();
}

function translate (x,y) {
	// scaling
	var max = height<width?height:width;
	
	// render center
	var xc = width/2;
	var yc = height/2;

	// result
	var rx = (x-xc)*4/max/s+cx;
	var ry = (y-yc)*4/max/s+cy;

	return [rx,ry];
}

var colors = new Array();
function color (n) {
	if (!colors[n]) {
		var r = Math.floor((Math.sin(n/15)+1)*127.5),
			g = Math.floor((Math.cos(n/15)+1)*127.5),
			b = Math.floor((Math.sin(Math.cos(n/15))+1)*127.5);
		colors[n] = 'rgb('+r+','+g+','+b+')';
	}
	return colors[n];
}

// Web Workers
var threads = 4;
var worker = new Array();
var state = new Array();
	// idle

for (var i = 0; i < threads; i++) {
	worker[i] = new Worker('render.js');
	worker[i].onmessage = function (input) {
		switch (input.data.type) {
			case 'result':
				state[input.data.id] = 'idle';
				var result = input.data.result;
				for (var i = 0; i < result.length; i++) {
					ctx.fillStyle = color(result[i].i);
					ctx.fillRect(result[i].x,result[i].y,1,1)
				}
				giveTask(input.data.id);
				if (++rendered == totalTasks) {
					console.timeEnd('render');
				}
			break;
			case 'cancel':
				state[input.data.id] = 'idle';
				giveTask(input.data.id);
			break;
			default:
				console.error('invalid message on main: ' + JSON.stringify(input.data));
		}
	}
	worker[i].postMessage({
		type: 'init',
		id: i,
		height: window.innerHeight,
		width: window.innerWidth
	});
	state[i] = 'idle';
}

var rendered;
var tasks;
var totalTasks;
function render () {
	// prepare
	rendered = 0;
	tasks = [];
	ctx.clearRect(0,0,width,height);
	console.time('render');

	// creating tasks
	var chunkSize = 100;
	for (var x = 0; x <= width/chunkSize; x++) {
		for (var y = 0; y <= height/chunkSize; y++) {
			tasks.push({
				xmin: x*chunkSize,
				xmax: (x+1)*chunkSize,
				ymin: y*chunkSize,
				ymax: (y+1)*chunkSize
			});
			// todo: don't render borders
		}
	}
	totalTasks = tasks.length;

	// giving tasks
	for (var i = 0; i < threads; i++) {
		if (state[i] != 'idle') {
			worker[i].postMessage({
				type: 'cancel'
			});
		} else {
			giveTask(i);
		}
	}
}

function giveTask (id) {
	if (tasks.length) {
		var task = tasks.splice(Math.floor(Math.random()*tasks.length),1)[0];
		state[id] = 'task';
		worker[id].postMessage({
			type: 'task',
			xmin: task.xmin,
			xmax: task.xmax,
			ymin: task.ymin,
			ymax: task.ymax,
			iterations: nmax,
			s: s,
			cx: cx,
			cy: cy
		});
	}
}