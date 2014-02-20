var canvas, ctx;

var nmin = 0, nmax = 40, cx=0, cy=0, s=1;

var height, width;

window.onload = function () {
	// getting variables from url
	var hashtag = location.hash.replace('#','').split('&');
	for (i in hashtag) {
		var variable = hashtag[i].split('=');
		switch (variable[0]) {
			case 'n': nmax = variable[1]*1; break;
			case 'x': cx   = variable[1]*1; break;
			case 'y': cy   = variable[1]*1; break;
			case 'z': s    = variable[1]*1; break;
		}
	}

	canvas = document.getElementsByTagName('canvas')[0];
	height = window.innerHeight;
	width = window.innerWidth;
	canvas.width = width;
	canvas.height = height;
	ctx = canvas.getContext('2d');
	render();
}
window.onresize = function () {
	height = window.innerHeight;
	width = window.innerWidth;
	canvas.width = width;
	canvas.height = height;

	for (var i = 0; i < threads; i++) {
		worker[i].postMessage({
			type: 'init',
			id: i,
			height: window.innerHeight,
			width: window.innerWidth
		});
	}
	render();
}
window.onclick = function (e) {
	s *= e.shiftKey?.5:2;
	nmax *= e.shiftKey?5/6:1.2;
	cx = translate(-width/2+2*(e.x||e.pageX),-height/2+2*(e.y||e.pageY))[0];
	cy = translate(-width/2+2*(e.x||e.pageX),-height/2+2*(e.y||e.pageY))[1];
	location.replace(location.href.split('#')[0] + '#n=' + nmax + '&x=' + cx + '&y=' + cy + '&z=' + s);
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
				giveTask(input.data.id);
				
				var result = input.data.result;
				if (input.data.jobid == jobid) {
					for (var i = 0; i < result.length; i++) {
						ctx.fillStyle = result[i].c;
						ctx.fillRect(result[i].x,result[i].y,1,1)
					}
				}
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
var jobid = -1;
function render () {
	// prepare
	jobid++;
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
			jobid: jobid,
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