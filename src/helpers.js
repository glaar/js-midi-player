function findGetParameter(parameterName) {
    let result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function(item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function relativeMouseCoords(e, canvas) {
  if (e.type !== "touchstart") {
    e.preventDefault();
  }

  let currentElement = canvas;
  let totalOffsetX = 0;
  let totalOffsetY = 0;

  do {
    totalOffsetX += currentElement.offsetLeft;
    totalOffsetY += currentElement.offsetTop;
  }
  while (currentElement = currentElement.offsetParent);

  const canvasX = (e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX)) - totalOffsetX;
  const canvasY = (e.pageY || (e.touches && e.touches[0] && e.touches[0].pageY)) - totalOffsetY;

  return {x: canvasX, y: canvasY}
}
