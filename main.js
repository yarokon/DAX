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

for (i = 10; i <= 510; i+=50) {
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

for (i = 10; i <= 510; i+=50) {
  for (j = 10; j <= 510; j+=50) {
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
var segments = [];

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

    var allCircles = document.querySelectorAll('circle');
    for (i = 0; i < allCircles.length; i++) {
      allCircles[i].style.fill = '#9E9E9E';
      allCircles[i].style.r = 3;
    }

    arrCircles.forEach(function(circle) {
      circle.style.r = 1;
    });

    if (svgField.contains(dashLine)) {
      svgField.removeChild(dashLine);
    }

    arr.pop();
    endDrawing = true;

    calculate();
  }
}

document.body.addEventListener('keydown', Events);

function Events(event) {
  switch (event.key) {
    case 'Enter': closeLine();
      break;
    case 'Escape': eraseAll();
     break;
  }
}

function closeLine() {
  if (!endDrawing) {
    newPolygon.attributes[0].value += ' Z';
    arrPoints.push(arrPoints[0]);
    closePath(arrPoints);
  }
}

function eraseAll() {
  if (svgField.contains(newPolygon)) {
    svgField.removeChild(newPolygon);
    newPolygon.style = '';
  }
  if (svgField.contains(dashLine)) {
    svgField.removeChild(dashLine);
  }

  arrPoints = [];
  nextPoint(true);

  var allCircles = document.querySelectorAll('circle');
  for (i = 0; i < allCircles.length; i++) {
    allCircles[i].style = '';
  }

  arrCircles[0].setAttribute('r', 3);
  arrCircles = [];

  segments.forEach(function(line) {
    svgField.removeChild(line);
  });
  segments = [];

  startDrawing = endDrawing = false;
  console.clear();
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

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

function sumVec(vec1, vec2) {
  return new Vector(vec1.x + vec2.x, vec1.y + vec2.y);
}

function scalar(vec, number) {
  return new Vector(vec.x * number, vec.y * number);
}

function determinant (a, b) {
  return a.x * b.y - b.x * a.y;
}

function equality (a, b) {
  return a.x === b.x && a.y === b.y;
}

function swap(a, b) {
  var c;
  if (a > b) {
    c = a;
    a = b;
    b = c;
  }
  return [a, b];
}

function nextItem (index, arr) {
  return index === arr.length - 1 ? arr[0] : arr[index + 1];
}

function nextIndex(index, arr) {
  return index === arr.length - 1 ? 0 : index + 1;
}

function prevItem (index, arr) {
  return index === 0 ? arr[arr.length - 1] : arr[index - 1];
}

/*********************************************************/

function calculate() {
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
        alert('Calculation error!');
        location.reload();
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
        if (index === arr.length - 1) {
          index = -1;
        }
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

    drawRoof(arrLines);
}

function drawRoof(mainArr) {
  var polygons = [];
  var arrLines = [];
  var arrPoints = [];
  var edgeLine = svgDraft.children[3];

  mainArr.forEach(function(line, index, arr) {
    var prevLine = prevItem(index, arr);
    var vec = sumVec(prevLine.vn, line.vn);
    vec = scalar(vec, 25);
    var p1 = line.p1;
    vec = sumVec(p1, vec);
    var point = new Point(vec.x, vec.y);
    arrPoints.push(point);

    var newEdgeLine = edgeLine.cloneNode();
    segments.push(newEdgeLine);
    setAttributes(newEdgeLine, {
      x1: p1.x,
      y1: p1.y,
      x2: point.x,
      y2: point.y
    });
    svgField.appendChild(newEdgeLine);
  });

  mainArr.forEach(function(line, index, arr) {

    var p1  = arrPoints[index];
    var p2 = nextItem(index, arrPoints);

    if (!equality(p1, p2)) {
      var newLine  = new Line(p1, p2, line.vt, line.vn);
      arrLines.push(newLine);
    }
  });

  var cross = checkIntersection(arrLines);

  while (cross) {
    arrLines = drawIntersection(arrLines, cross);
    cross = checkIntersection(arrLines);
  }

  fragmentationPolygon(arrLines);
}

function checkIntersection(arr) {
  for (i = 0; i < arr.length; i++) {
    var nextLine;
    var a1, a2, b1, b2;
    var checkPoints;

    a1 = Object.assign({}, arr[i].p1);
    a2 = Object.assign({}, arr[i].p2);

    for (j = i + 1; j < arr.length; j++) {
      nextLine = arr[j];
      b1 =  Object.assign({}, nextLine.p1);
      b2 =  Object.assign({}, nextLine.p2);

      if (a1.x === b1.x && a2.x === b2.x) {
        checkPoints = swap(a1.y, a2.y);
        a1.y = checkPoints[0];
        a2.y = checkPoints[1];
        checkPoints = swap(b1.y, b2.y);
        b1.y = checkPoints[0];
        b2.y = checkPoints[1];
        if (pointCheck(a1.y, a2.y, b1.y, b2.y)) {
          return [i, j];
        }
      } else if (a1.y === b1.y && a2.y === b2.y) {
        checkPoints = swap(a1.x, a2.x);
        a1.x = checkPoints[0];
        a2.x = checkPoints[1];
        checkPoints = swap(b1.x, b2.x);
        b1.x = checkPoints[0];
        b2.x = checkPoints[1];
        if (pointCheck(a1.x, a2.x, b1.x, b2.x)) {
          return [i, j];
        }
      }
    }
  }
  return false;
}

function pointCheck(a1, a2, b1, b2) {
  return (a1 != b2 && a2 != b1) &&
        ((a1 >= b1 && a1 <= b2) || (a2 >= b1 && a2 <= b2) ||
         (a1 >= b1 && a2 <= b2) || (a1 <= b1 && a2 >= b2));
}

function drawIntersection(arr, cross) {
  var points = [];
  var a = arr[cross[0]];
  var b = arr[cross[1]];
  var x, y;
  var vertical = (Math.abs(a.vn.x) === 1);

  if (vertical) {
    points.push(a.p1.y);
    points.push(a.p2.y);
    points.push(b.p1.y);
    points.push(b.p2.y);
    x = a.p1.x;
  } else {
    points.push(a.p1.x);
    points.push(a.p2.x);
    points.push(b.p1.x);
    points.push(b.p2.x);
    y = a.p1.y;
  }
  points.sort(function(l, m){return l-m;});

  var edgeLine = svgDraft.children[3];
  var newEdgeLine = edgeLine.cloneNode();
  segments.push(newEdgeLine);
  if (x) {
    setAttributes(newEdgeLine, {
      'x1': x,
      'y1': points[1],
      'x2': x,
      'y2': points[2]
    });
  } else {
    setAttributes(newEdgeLine, {
      'x1': points[1],
      'y1': y,
      'x2': points[2],
      'y2': y
    });
  }
  svgField.appendChild(newEdgeLine);

  var leftLine;
  var rightLine;

  if (!leftLine)
    leftLine = replaceLine(points[0], points[1], a, vertical);
  if (!leftLine)
    leftLine = replaceLine(points[0], points[1], b, vertical);
  if (!rightLine)
    rightLine = replaceLine(points[2], points[3], a, vertical);
  if (!rightLine)
    rightLine = replaceLine(points[2], points[3], b, vertical);

  arr[cross[0]] = leftLine;
  arr[cross[1]] = rightLine;

  arr = arr.filter(function(line, index, arr) {
    return line;
  });

  return arr;
}

function replaceLine(c1, c2, line, orientation) {
  var d1, d2;
  var currentLine = _.cloneDeep(line);
  var checkPoints;

  if (c1 !== c2) {
    if (orientation) {
      checkPoints = swap(currentLine.p1.y, currentLine.p2.y);
      d1 = checkPoints[0];
      d2 = checkPoints[1];

      if (pointCheck(c1, c2, d1, d2)) {
        if (currentLine.vt.y === 1) {
          currentLine.p1.y = c1;
          currentLine.p2.y = c2;
        } else {
          currentLine.p1.y = c2;
          currentLine.p2.y = c1;
        }
        return currentLine;
      }
    } else {
      checkPoints = swap(currentLine.p1.x, currentLine.p2.x);
      d1 = checkPoints[0];
      d2 = checkPoints[1];

      if (pointCheck(c1, c2, d1, d2)) {
        if (currentLine.vt.x === 1) {
          currentLine.p1.x = c1;
          currentLine.p2.x = c2;
        } else {
          currentLine.p1.x = c2;
          currentLine.p2.x = c1;
        }
        return currentLine;
      }
    }
  } else {
    return false;
  }
}

function fragmentationPolygon(arr) {
  var indexArr = [];
  var polygons = [];
  var newArr = [];

  var firstPoint;
  var secondPoint;
  var nextInd, lastInd;

  while (arr.length) {
    indexArr = [];
    i = lastInd= 0;

    firstPoint = arr.map(function(line, index){
      return line.p1.xy();
    });
    secondPoint = arr.map(function(line, index){
      return line.p2.xy();
    });

    startPoint = firstPoint[i];

    indexArr.push(i);

    do {
      lastInd = firstPoint.lastIndexOf(secondPoint[i]);
      i = nextIndex(i, arr);

      if (i === lastInd) {
        indexArr.push(i);
      } else {
        i = lastInd;
        indexArr.push(i);
      }

    } while (secondPoint[i] !== startPoint);

    newArr = indexArr.map(function(index) {
      return arr[index];
    });

    reduceArr(newArr);

    polygons.push(newArr);

    arr = arr.filter(function(line, arrIndex) {
      return !indexArr.some(function(index) {
        return arrIndex === index;
      });
    });
  }

  polygons.forEach(function(arr) {
    drawRoof(arr);
  });
}

function reduceArr(arr) {
  var deletedPoints = [];

  arr.forEach(function(line, index){
    var nextLine = nextItem(index, arr);

    while (line.vt.x === nextLine.vt.x && line.vt.y === nextLine.vt.y) {
      deletedPoints.push(line.p2.pId);
      line.p2 = nextLine.p2;
      if (index === arr.length - 1) {
        index = -1;
      }
      arr.splice(index + 1, 1);
      nextLine = nextItem(index, arr);
    }
  });
}