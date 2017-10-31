Vue.filter('formatDuration', function (numSeconds) {
  numSeconds = Math.floor(numSeconds);
  let minutes = Math.floor(numSeconds / 60);
  let seconds = numSeconds - minutes * 60;

  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return `${minutes}:${seconds}`;
});

Vue.filter('formatInteger', function (number) {
  return Math.round(number) | 0;
});

