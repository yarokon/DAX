var gameField = document.getElementById('field');
var svgField = gameField.firstElementChild;
var svgDraft = document.getElementById('draft');

var fieldStyle = window.getComputedStyle(gameField, null);
var border = parseInt(fieldStyle.borderWidth);

var demo = document.getElementById('demo');

var offset = {
  left: null,
  top: null
};

var coords  = {
  x: null,
  y: null
};

window.addEventListener('resize', showSize);
window.addEventListener('load', showSize);

function showSize() {
  offset.left = gameField.offsetLeft + border;
  offset.top = gameField.offsetTop + border;
}

svgField.addEventListener('mousemove', showcoords);

function showcoords(event) {
  coords.x = Math.round(event.pageX - offset.left);
  coords.y = Math.round(event.pageY - offset.top);
  demo.innerHTML = coords.x + ' ' + coords.y;
}

/*********************************************************/

var i;
var j;

var lineH = svgDraft.firstElementChild;
var lineV = svgDraft.lastElementChild;
var circle = svgDraft.children[1];

for (i = 5; i <= 505; i+=50) {
  var newLineH = lineH.cloneNode();
  var newLineV = lineV.cloneNode();

  for (j = 0; j < 4; j++) {
    if (j % 2) {
      newLineH.attributes[j].value = i;
    } else {
      newLineV.attributes[j].value = i;
    }
  }

  svgField.appendChild(newLineH);
  svgField.appendChild(newLineV);
}

for (i = 5; i <= 505; i+=50) {
  for (j = 5; j <= 505; j+=50) {
    var newCircle = circle.cloneNode();
    newCircle.setAttribute('cx', i);
    newCircle.setAttribute('cy', j);
    svgField.appendChild(newCircle);
  }
}

/*********************************************************/

nextPoint = (function () {
  var pointId = 1;
  return function(reset) {
    if (reset) {
      pointId = 0;
    }
    return pointId++;
  };
})();

function Point(x, y) {
  this.x = x;
  this.y = y;
  this.xy = function() {
    return this.x + ' ' + this.y;
  };
  this.pId = nextPoint();
}

var arrPoints = [];

function Vector(x, y) {
  this.x = x;
  this.y = y;
}

function Line(p1, p2, vn, vt) {
  this.p1 = p1;
  this.p2 = p2;
  this.vn = vn;
  this.vt = vt;
}

/*********************************************************/

var polygon = svgDraft.children[2];
var newPolygon = polygon.cloneNode();
var dashLine = polygon.cloneNode();
dashLine.id = 'dash-line';

var circleArr = [];

var startDrawing = false;
var endDrawing = false;

svgField.addEventListener('click', drawPolygon);

function drawPolygon(event) {
  var circleTarget = event.target;

  if (circleTarget.nodeName === 'circle' && !endDrawing) {
    var x = circleTarget.getAttribute('cx');
    var y = circleTarget.getAttribute('cy');

    circleTarget.style.r = 4;
    circleTarget.style.fill = '#ff9800';
    circleArr.push(circleTarget);

    if (!startDrawing) {
      newPolygon.setAttribute('d', 'M'.concat(x, ' ', y));
      svgField.appendChild(newPolygon);
      svgField.appendChild(dashLine);

      circleTarget.style.r = 5;
      arrPoints.push(new Point(x, y));
      startDrawing = true;
    } else {
      newPolygon.attributes[0].value += ' L'.concat(x, ' ', y);
      arrPoints.push(new Point(x, y));
      closePath(arrPoints);
    }

    svgField.appendChild(circleTarget);
  }
}

function closePath(arr) {
  if (arr[0].xy() === arr[arr.length - 1].xy()) {
    newPolygon.style.fill = 'rgba(156, 39, 176, 0.65)';
    newPolygon.style.stroke = '#ff9800';

    if (svgField.contains(dashLine)) {
      svgField.removeChild(dashLine);
    }

    arr.pop();
    endDrawing = true;
  }
}

document.body.addEventListener('keydown', closeLine);

function closeLine(event) {
  if (event.key === 'Enter' && !endDrawing) {
    newPolygon.attributes[0].value += ' Z';
    arrPoints.push(arrPoints[0]);
    closePath(arrPoints);
  }
}

document.body.addEventListener('keydown', eraseAll);

function eraseAll(event) {
  if (event.key === 'Escape') {
    if (svgField.contains(newPolygon)) {
      svgField.removeChild(newPolygon);
      newPolygon.style = '';
    }
    if (svgField.contains(dashLine)) {
      svgField.removeChild(dashLine);
    }

    arrPoints = [];
    nextPoint(true);

    circleArr.forEach(function(item) {
      item.style = '';
    });
    circleArr = [];

    startDrawing = endDrawing = false;
  }
}

svgField.addEventListener('mousemove', showDash);

function showDash(event) {
  if (!endDrawing) {
    var arrLength = arrPoints.length;

    if (arrLength) {
      var xm = coords.x;
      var ym = coords.y;
      var xp = arrPoints[arrLength - 1].x;
      var yp = arrPoints[arrLength - 1].y;
      var dx = xp - xm;
      var dy = yp - ym;
      var d = Math.sqrt(dx * dx + dy * dy);
      var cosA = dx / (d + 1e-3);
      var sinA = dy / (d + 1e-3);

      dashLine.setAttribute('d', 'M'.concat(xp, ' ', yp, ' L', Math.round(xm + 5 * cosA), ' ', Math.round(ym + 5 * sinA)));
    }
  }
}