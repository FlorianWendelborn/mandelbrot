// require
importScripts('complex.js');

// information
var id;
var width;
var height;
var s;

var cancel,rendering;

onmessage = function (input) {
	switch (input.data.type) {
		case 'init':
			id = input.data.id;
			width = input.data.width;
			height = input.data.height;
		break;
		case 'task':
			rendering = true;
			var xmin = input.data.xmin;
			var xmax = input.data.xmax;
			var ymin = input.data.ymin;
			var ymax = input.data.ymax;
			var s = input.data.s;
			var cx = input.data.cx;
			var cy = input.data.cy;
			var iterations = input.data.iterations;
			var jobid = input.data.jobid;
			
			var result = new Array();

			// rendering some pixels
			for (var xi = xmin; xi < xmax; xi++) {
				for (var yi = ymin; yi < ymax; yi++) {
					var calculated = translate(xi,yi,cx,cy,s,iterations);
					if (cancel) {
						xi = xmax;
						yi = ymax;
					} else if (calculated) {
						result.push({
							x: xi,
							y: yi,
							c: calculated[1],
							i: calculated[0]
						});
					}
				}
			}
			
			// responding
			if (cancel) {
				console.log('canceled');
				cancel = false;
				postMessage({
					type: 'cancel',
					id: id
				});
			} else {
				postMessage({
					jobid: jobid,
					type: 'result',
					id: id,
					result: result
				});
			}
			rendering = false;
		break;
		case 'cancel':
			if (rendering) {
				cancel = true;
			}
		break;
		default:
			console.error('invalid message on worker ' + id + ': ' + JSON.stringify(input.data));
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
			return ret;
		}
	} else {
		return false;
	}
}

function iterate (x,y,n) {
	// the real magic is happening here
	var z = new Complex(x,y),
		c = new Complex(x,y);
	
	for (var i = 0; i < n; i++) {
		z = z.multiply(z).add(c);
		if (z.abs() > 2) {
			z = z.multiply(z).add(c);
			z = z.multiply(z).add(c);
			z = z.multiply(z).add(c);
			z = z.multiply(z).add(c);
			z = z.multiply(z).add(c);
			z = z.multiply(z).add(c);

			var mu = i + 1 - Math.log(Math.log(z.abs()))/Math.log(2);

			return [i+1,'hsl('+mu*10+',100%,70%)'];
		}
	}
	return false;
}