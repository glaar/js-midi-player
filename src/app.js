let app = new Vue({
  el: '#app',
  data: {
    time: 0,
    isPlaying: false,
    loadingMidi: true,
    channels: null,
    currentTempo: null,
    originalTempo: null,
    midiFilename: null,
    isDragging: false,
    wasPlayingOnMouseDown: false,
    startMouseDownPos: null,
    transportTimeOnMouseDown: 0,
  },
  created: function() {
    this.synth = new Tone.PolySynth(5).toMaster();
    this.canvas = document.getElementById('piano-roll-canvas');
    this.drawer = new Drawer(this.canvas, this);

    this.midiFilename = findGetParameter('song');
    if (!this.midiFilename) {
      //alert('No song is selected, defaulting to "TCPBC jingle.mid"');
      this.midiFilename = 'TCPBC jingle.mid';
    }

    let that = this;
    this.noteNumberExtent = [48, 60];

    MidiConvert.load(`songs/${that.midiFilename}`).then(function(midi) {
      // make sure you set the tempo before you schedule the events
      that.originalTempo = Tone.Transport.bpm.value = midi.header.bpm;
      that.currentTempo = that.originalTempo;
      const quarterNoteDuration = 60 / that.originalTempo;  // in seconds

      function getTempoDependentTime(timeInSeconds) {
        let sixteenths = 4 * timeInSeconds / quarterNoteDuration;
        let measures = 0 | (sixteenths / 16);
        sixteenths -= measures * 16;
        let beats = 0 | (sixteenths / 4);
        sixteenths -= beats * 4;
        return `${measures}:${beats}:${sixteenths.toFixed(2)}`;
      }

      that.channels = [];
      that.endTime = 0;
      for (let track of midi.tracks) {
        if (track.channelNumber >= 0) {
          let channel = {
            track: track,
            isActive: true,
            icon: `melody.png`,
            ordering: 0,
          };

          if (channel.track.name.toLowerCase().indexOf('bass') !== -1) {
            channel.icon = `bass.png`;
            channel.ordering = 5;
          } else if (channel.track.name.toLowerCase().indexOf('bariton') !== -1) {
            channel.icon = `baritone.png`;
            channel.ordering = 4;
          } else if (channel.track.name.toLowerCase().indexOf('tenor') !== -1) {
            channel.icon = `tenor.png`;
            channel.ordering = 3;
          } else if (channel.track.name.toLowerCase().indexOf('alt') !== -1) {
            channel.icon = `alto.png`;
            channel.ordering = 2;
          } else if (channel.track.name.toLowerCase().indexOf('sopran') !== -1) {
            channel.icon = `soprano.png`;
            channel.ordering = 1;
          } else if (channel.track.name.toLowerCase().indexOf('solo') !== -1) {
            channel.icon = `soprano.png`;
            channel.ordering = 0;
          }

          channel.endTime = track.duration;
          if (that.endTime < channel.endTime) {
            that.endTime = channel.endTime;
          }

          channel.part = new Tone.Part(
            function(time, note) {
              const duration = getTempoDependentTime(note.duration);
              that.synth.triggerAttackRelease(note.name, duration, time, note.velocity)
            },
            track.notes
          ).start(0);

          that.channels.push(channel);

          for (const note of track.notes) {
            if (note.midi < that.noteNumberExtent[0]) {
              that.noteNumberExtent[0] = note.midi;
            } else if (note.midi > that.noteNumberExtent[1]) {
              that.noteNumberExtent[1] = note.midi;
            }
          }
        }
      }
      that.channels.sort((a, b) => a.ordering - b.ordering);

      Tone.Transport.schedule(function(time){
        that.stop();
      }, getTempoDependentTime(that.endTime + 1));

      that.loadingMidi = false;

      setDimensions();

      render();

      window.addEventListener('keyup', onKeyUp);

      function handleStart(e) {
        that.startMouseDownPos = relativeMouseCoords(e, that.canvas);
        that.isDragging = false;
        that.wasPlayingOnMouseDown = that.isPlaying;
        that.transportTimeOnMouseDown = Tone.Transport.seconds;
        if (that.isPlaying) {
          that.pause();
        }
      }

      function handleMove(e) {
        e.preventDefault();
        if (that.startMouseDownPos) {
          that.isDragging = true;
          let position = relativeMouseCoords(e, that.canvas);
          let distance = that.startMouseDownPos.x - position.x;
          const timeDiff = (distance / that.drawer.noteScale) / 2;
          Tone.Transport.seconds = Math.min(
            Math.max(that.transportTimeOnMouseDown + timeDiff, 0),
            that.endTime - 0.1
          );
        }
      }

      function handleEnd(e) {
        let position = relativeMouseCoords(e, that.canvas);

        if (that.isDragging) { // drag
          let distance = that.startMouseDownPos.x - position.x;
          if (Math.abs(distance) < 5) {
            // Small drag handled as click
            if (!that.wasPlayingOnMouseDown) {
              that.play();
            }
          } else {
            // Drag end
            if (that.wasPlayingOnMouseDown) {
              that.play();
            }
          }
        } else { // click
          if (!that.wasPlayingOnMouseDown) {
            that.play();
          }
        }

        that.startMouseDownPos = null;
      }

      that.canvas.addEventListener("mousedown", handleStart, false);
      that.canvas.addEventListener("touchstart", e => {handleStart(e); e.stopPropagation()}, false);
      that.canvas.addEventListener("mousemove", handleMove, false);
      that.canvas.addEventListener("touchmove", handleMove, false);
      that.canvas.addEventListener("mouseup", handleEnd, false);
      that.canvas.addEventListener("touchend", handleEnd, false);

    }, function() {
      alert('Failed to load the specified midi file :(');
    });
  },
  methods: {
    togglePlay: function() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        Tone.Transport.start()
      } else {
        Tone.Transport.pause()
      }
    },
    pause: function() {
      Tone.Transport.pause();
      this.isPlaying = false;
    },
    play: function() {
      Tone.Transport.start();
      this.isPlaying = true;
    },
    stop: function() {
      Tone.Transport.stop();
      this.isPlaying = false;
    },
    toggleChannel: function(channelIndex) {
      const channel = this.channels[channelIndex];
      channel.isActive = !channel.isActive;
      channel.part.mute = !channel.isActive;
    },
    decreaseTempo: function() {
      this.currentTempo /= 1.1;
      Tone.Transport.bpm.value = this.currentTempo;
    },
    increaseTempo: function() {
      this.currentTempo *= 1.1;
      Tone.Transport.bpm.value = this.currentTempo;
    },
  }
});

function onKeyUp(e) {
  if (e.keyCode !== 32) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  app.togglePlay();
}

function render() {
  requestAnimationFrame(render);

  // The time elapsed in seconds
  app.time = Tone.Transport.seconds;
  app.drawer.draw();
}

function setDimensions() {
  let sidebar = document.getElementsByClassName('sidebar')[0];
  let canvasWrapper = document.getElementsByClassName('canvas-wrapper')[0];
  let sidebarWidth = 0;
  if (window.innerWidth < 500) {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'block';
    sidebarWidth = sidebar.offsetWidth;
  }
  canvasWrapper.style.width = `${window.innerWidth - sidebarWidth}px`;
  canvasWrapper.style.height = `${window.innerHeight}px`;
  app.canvas.width = (window.innerWidth - sidebarWidth) / 2;
  app.canvas.height = window.innerHeight / 2;
}

(function() {
  let resizeTimeout = null;

  function deferResize() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null;
      actualResizeHandler();
    }, 34);
  }

  function actualResizeHandler() {
    setDimensions();
  }

  window.addEventListener("resize", deferResize, false);
}());



