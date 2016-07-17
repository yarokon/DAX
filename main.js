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

svgField.addEventListener('mousemove', showCoords);

function showCoords(event) {
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
  var pointId = 0;
  return function(reset) {
    if (reset) {
      pointId = -1;
    }
    return pointId++;
  };
})();

function Point(x, y) {
  this.x = +x;
  this.y = +y;
  this.xy = function() {
    return this.x + ' ' + this.y;
  };
  this.pId = nextPoint();
}

var arrPoints = [];
var arrLines = [];

function Vector(x, y) {
  this.x = +x;
  this.y = +y;
}

function Line(p1, p2, vt, vn) {
  this.p1 = p1;
  this.p2 = p2;
  this.vt = vt;
  this.vn = vn;
}

/*********************************************************/

var polygon = svgDraft.children[2];
var newPolygon = polygon.cloneNode();
var dashLine = polygon.cloneNode();
dashLine.id = 'dash-line';

var arrCircles = [];

var startDrawing = false;
var endDrawing = false;

svgField.addEventListener('click', drawPolygon);

function drawPolygon(event) {
  var circleTarget = event.target;

  if (circleTarget.nodeName === 'circle' && !endDrawing) {
    var x = circleTarget.getAttribute('cx');
    var y = circleTarget.getAttribute('cy');

    if (!startDrawing) {
      newPolygon.setAttribute('d', 'M'.concat(x, ' ', y));
      svgField.appendChild(newPolygon);
      svgField.appendChild(dashLine);

      circleTarget.setAttribute('r', 4);
      arrPoints.push(new Point(x, y));
      startDrawing = true;
    } else {
      newPolygon.attributes[0].value += ' L'.concat(x, ' ', y);
      circleTarget.style.r = 4;
      arrPoints.push(new Point(x, y));
      closePath(arrPoints);
    }

    circleTarget.style.fill = '#ff9800';
    arrCircles.push(circleTarget);
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

    arrCircles[0].setAttribute('r', 3);
    arrCircles.forEach(function(item) {
      item.style = '';
    });
    arrCircles = [];

    startDrawing = endDrawing = false;
  }
}

var regExpPlatforms = /Android|webOS|iPhone|Windows Phone/i;
var isMobile = regExpPlatforms.test(navigator.userAgent);

if (!isMobile) {
  svgField.addEventListener('mousemove', showDash);
}

function showDash(event) {
  if (!endDrawing) {
    var arrLength = arrPoints.length;

    if (arrLength) {
      var point = arrPoints[arrLength - 1];
      var vec = projection(coords, point);

      dashLine.setAttribute('d', 'M'.concat(point.x, ' ', point.y, ' L',
        Math.round(coords.x + 5 * vec.x),' ', Math.round(coords.y + 5 * vec.y)));
    }
  }
}

/*********************************************************/

function projection (a, b) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  var d = Math.sqrt(dx * dx + dy * dy);
  var cosA = roundNumber(dx / (d + 1e-3), 3);
  var sinA = roundNumber(dy / (d + 1e-3), 3);
  return new Vector(cosA, sinA);
}

function roundNumber(value, precision) {
  precision = precision || 1;
  var power = Math.pow(10, precision);
  return Math.round(value * power) / power;
}

function determinant (a, b) {
  return a.x * b.y - b.x * a.y;
}

function nextItem (index, arr) {
  return arr.length - 1 === index ? arr[0] : arr[index + 1];
}

document.body.addEventListener('keydown', calculate);

function calculate(event) {
  if (event.key === ' ' && endDrawing) {
    arrLines = arrPoints.map(function(point, index, arr){
      var nextPoint = nextItem(index, arr);
      return new Line (point, nextPoint, projection(point, nextPoint));
    });

    var anglesSum = arrLines.reduce(function(total, line, index, arr){
      var nextLine = nextItem(index, arr);
      return total + 90 * determinant(line.vt, nextLine.vt);
    }, 0);

    var sinA;
    switch (anglesSum) {
      case 360:
        sinA = 1;
        break;
      case -360:
        sinA = -1;
        break;
      default:
        sinA = 0;
        console.log('Error');
    }

    arrLines.forEach(function(line){
      var x = line.vt.y * -sinA;
      var y = line.vt.x * sinA;
      line.vn = new Vector(x, y);
    });

    var deletedPoints = [];

    arrLines.forEach(function(line, index, arr){
      var nextLine = nextItem(index, arr);

      while (line.vt.x === nextLine.vt.x && line.vt.y === nextLine.vt.y) {
        deletedPoints.push(line.p2.pId);
        line.p2 = nextLine.p2;
        arr.splice(index + 1, 1);
        nextLine = nextItem(index, arr);
      }
    });

    arrPoints = arrLines.map(function(line) {
      return line.p1;
    });

    deletedPoints.forEach(function(point, index) {
      arrCircles[point].style.r = 0;
    });

    console.log(arrLines);
  }
}