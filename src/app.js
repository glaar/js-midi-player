let app = new Vue({
  el: '#app',
  data: {
    time: 0,
    isPlaying: false,
    loadingMidi: true,
    channels: null,
    currentTempo: null,
    originalTempo: null,
    midiFilename: null
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

    MidiConvert.load(`songs/${that.midiFilename}`, function(midi) {
      // make sure you set the tempo before you schedule the events
      that.originalTempo = Tone.Transport.bpm.value = midi.header.bpm;
      that.currentTempo = that.originalTempo;
      const quarterNoteDuration = 60 / that.originalTempo;  // in seconds

      that.channels = [];
      for (let track of midi.tracks) {
        if (track.channelNumber >= 0) {
          let channel = {
            track: track,
            isActive: true,
            icon: `melody.png`,
            ordering: 0
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

          channel.part = new Tone.Part(
            function(time, note) {
              let sixteenths = 4 * note.duration / quarterNoteDuration;
              let measures = 0 | (sixteenths / 16);
              sixteenths -= measures * 16;
              let beats = 0 | (sixteenths / 4);
              sixteenths -= beats * 4;
              const duration = `${measures}:${beats}:${sixteenths.toFixed(2)}`;
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

      that.loadingMidi = false;

      setDimensions();

      render();

      window.addEventListener('keyup', onKeyUp);

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
  console.log('keyUp', e);
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



