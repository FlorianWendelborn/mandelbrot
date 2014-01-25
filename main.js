var canvas, ctx;

var nmin = 0, nmax = 30, xmin = 0, xmax, ymin = 0, ymax, cx=0, cy=0, s=1;

var rendering = false;

var Complex = require('complex');

window.onload = function () {
	canvas = document.getElementsByTagName('canvas')[0];
	xmax = window.innerWidth;
	ymax = window.innerHeight;
	canvas.width = xmax;
	canvas.height = ymax;
	ctx = canvas.getContext('2d');
	makeAStep(xmin);
}
window.onclick = function (e) {
	s = s*2;
	nmax = nmax+10;
	cx = translate(e.x,e.y,true)[0];
	cy = translate(e.x,e.y,true)[1];
	ctx.clearRect(xmin,ymin,xmax,ymax);
	makeAStep(xmin);
}

function preTranslate () {

}

function translate (x,y,zoom) {
	// scaling
	var max = ymax<xmax?ymax:xmax;
	
	// render center
	var xc = xmax/2;
	var yc = ymax/2;

	// result
	var rx = (x-xc)*4/max/s+cx;
	var ry = (y-yc)*4/max/s+cy;
	if (zoom) {
		return [rx,ry];
	}
	if (Math.sqrt(rx*rx+ry*ry)<2) {
		var ret = iterate(rx,ry,nmax);
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

function color (ni) {
	var r = Math.floor((Math.sin(ni/15)+1)*127.5),
		g = Math.floor((Math.cos(ni/15)+1)*127.5),
		b = Math.floor((Math.sin(Math.cos(ni/15))+1)*127.5);

	return 'rgb('+r+','+g+','+b+')';
}

function makeAStep (xi) {
	// rendering some pixels
	rendering = true;
	for (var yi = ymin; yi < ymax; yi++) {
		var ni = translate(xi,yi);
		if (ni) {
			ctx.fillStyle = color(ni);
			ctx.fillRect(xi,yi,1,1);
		}
	}
	setTimeout(function () {
		if (xi < xmax) {
			makeAStep(xi+1);
		} else {
			rendering = false;
			console.log('finished');
		}
	},1);
}

function iterate (x,y,n) {
	// the real magic is happening here
	var c = new Complex(x,y),
		e = c.clone();
	
	for (var i = 0; i < n; i++) {
		c = c.pow(2).add(e);
		// c = c.pow(2).add(e.multiply(new Complex(-1,0)));
		if (c.abs() > 2) {
			return i;
		}
	}
	return false;
}