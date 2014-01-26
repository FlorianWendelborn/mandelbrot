// require
importScripts('complex.js');

// information
var id;
var width;
var height;
var s;

function finishRender (result) {
	postMessage({
		type: 'result',
		id: id,
		result: result
	});
}

onmessage = function (input) {
	switch (input.data.type) {
		case 'init':
			id = input.data.id;
			width = input.data.width;
			height = input.data.height;
		break;
		case 'task':
			var xmin = input.data.xmin;
			var xmax = input.data.xmax;
			var ymin = input.data.ymin;
			var ymax = input.data.ymax;
			var iterations = input.data.iterations;
			var s = input.data.s;
			var cx = input.data.cx;
			var cy = input.data.cy;
			var result = new Array();

			// rendering some pixels
			for (var xi = xmin; xi < xmax; xi++) {
				for (var yi = ymin; yi < ymax; yi++) {
					var calculated = translate(xi,yi,cx,cy,s,iterations);
					if (calculated) {
						result.push({
							x: xi,
							y: yi,
							i: calculated
						});
					}
				}
			}
			finishRender(result);
		break;
		case 'cancel':
			// todo
		break;
		default:
			console.error('invalid message on worker ' + id);
			console.log('Worker ' + id + ' got: ' + JSON.stringify(input.data));
	}
}

// code
function translate (x,y,cx,cy,s,iterations) {
	// scaling
	var max = height<width?height:width;
	
	// render center
	var xc = width/2;
	var yc = height/2;

	// result
	var rx = (x-xc)*4/max/s+cx;
	var ry = (y-yc)*4/max/s+cy;
	if (Math.sqrt(rx*rx+ry*ry)<2) {
		var ret = iterate(rx,ry,iterations);
		if (ret === false) {
			return false;
		} else {
			ret = ret+1;
			return ret;
		}
	} else {
		return false;
	}
}

function iterate (x,y,n) {
	// the real magic is happening here
	var c = new Complex(x,y),
		e = new Complex(x,y);
	
	for (var i = 0; i < n; i++) {
		c = c.multiply(c).add(e);
		// c = c.multiply(c).add(e.multiply(new Complex(-1,0)));
		if (c.abs() > 2) {
			return i;
		}
	}
	return false;
}