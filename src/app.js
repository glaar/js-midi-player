let app = new Vue({
  el: '#app',
  data: {
    time: "0",
    isPlaying: false,
    loadingMidi: true,
    channels: null
  },
  created: function() {
    this.synth = new Tone.PolySynth(8).toMaster();
    this.canvas = document.getElementById('piano-roll-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.midiFilename = findGetParameter('song');
    if (!this.midiFilename) {
      //alert('No song is selected, defaulting to "TCPBC jingle.mid"');
      this.midiFilename = 'TCPBC jingle.mid';
    }

    let that = this;

    MidiConvert.load(that.midiFilename, function(midi) {
      that.loadingMidi = false;
      that.channels = [];
      for (let track of midi.tracks) {
        if (track.channelNumber >= 0) {
          that.channels.push({
            track: track,
            isActive: true
          });
        }
      }

      // make sure you set the tempo before you schedule the events
      Tone.Transport.bpm.value = midi.header.bpm;

      // pass in the note events from one of the tracks as the second argument to Tone.Part
      let midiPart = new Tone.Part(
        function(time, note) {
          //use the events to play the synth
          that.synth.triggerAttackRelease(note.name, note.duration, time, note.velocity)
        },
        midi.tracks[3].notes
      ).start();

      setDimensions();

      render();
    });
  },
  methods: {
    togglePlay: function() {
      if (this.isPlaying) {
        Tone.Transport.start()
      } else {
        Tone.Transport.stop()
      }
    }
  }
});

function render() {
  requestAnimationFrame(render);

  // The time elapsed in seconds
  app.time = Tone.Transport.seconds.toFixed(2);

  draw(app.canvas, app.ctx, app.channels);
}

function setDimensions() {
  let sidebar = document.getElementsByClassName('sidebar')[0];
  let sidebarWidth = 0;
  if (window.innerWidth < 600) {
    sidebar.style.display = 'none';
  } else {
    sidebar.style.display = 'block';
    sidebarWidth = sidebar.offsetWidth;
  }
  app.canvas.width = window.innerWidth - sidebarWidth;
  app.canvas.height = window.innerHeight;
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



