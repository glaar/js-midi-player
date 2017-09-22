t = 0;
play_forward_trigger = 0;

function Mixer() {
    var webkitAudioContext = AudioContext || webkitAudioContext;
    this.ax = new webkitAudioContext();
    this.ax.createJavaScriptNode = this.ax.createScriptProcessor || this.ax.createJavaScriptNode;
    this.ax.createGainNode = this.ax.createGain || this.ax.createGainNode;
    this.jsnode = this.ax.createJavaScriptNode(1024 * 4, 1, 2);
    this.note_number = 0;
    this.velocity = 0;

    var that = this;
    this.jsnode.onaudioprocess = function(e) {
        that.process(e);
    };

    this.process = function(e) {

        var datal = e.outputBuffer.getChannelData(0);
        var datar = e.outputBuffer.getChannelData(1);
        for (var i = 0; i < datal.length; i++) {
            play_forward_trigger++;
            if (play_forward_trigger == 44) {
                midi.play_forward(1);
                play_forward_trigger = 0;
            }
            datal[i] = 0;
            for (var j = 0; j < this.instruments.length; j++) {
                datal[i] += this.instruments[j].generate(t);
            }
            if (t > 3357333) datal[i] *= Math.max(0, (1 - (t - 3357333) / 352800));
            datar[i] = datal[i];
            t++;
        }

    };

    this.instruments = [];
    for (var i = 0; i < 14; i++) {
        this.instruments[i] = new Instrument(i);
        this.instruments[i].generate = instruments(i); //setter ulike synthfunksjoner p� ulike midikanaler
    }

    this.handle_event = function(e) {
        if (e.midi_channel > 0) {
            return;  // temporary disable all channels but 0
        }
        if (e.type == 0x9) {	//note on
            this.instruments[e.midi_channel].note_on(e.note_number, e.velocity);
        } else if (e.type == 0x8) {	//note off
            this.instruments[e.midi_channel].note_off(e.note_number);
        }
    };


    this.analyser = this.ax.createAnalyser();
    this.analyser.fftSize = 1024;
    this.convolver = this.ax.createConvolver();
    this.gainNode = this.ax.createGain();
    var buffer = this.ax.createBuffer(2, 44100 * 3, 44100);
    var channeldatal = buffer.getChannelData(0);
    var channeldatar = buffer.getChannelData(1);
    for (var i = 0; i < 10000; i++) {
        channeldatal[i] = (2 * Math.random() - 1);
        channeldatar[i] = (2 * Math.random() - 1);
    }
    for (var i = 10000; i < buffer.length; i++) {
        channeldatal[i] = (2 * Math.random() - 1) / (i / 10000);
        channeldatar[i] = (2 * Math.random() - 1) / (i / 10000);
    }
    this.convolver.buffer = buffer;

    this.convolver.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.ax.destination);
    this.gainNode.gain.value = 1;

    this.setVolume = function(v) {
        this.gainNode.gain.value = v;
    };
}

Mixer.prototype.start = function() {
    this.jsnode.connect(this.gainNode);
    this.jsnode.connect(this.convolver);
    this.jsnode.connect(this.analyser);
};

function Instrument(channel) {
    this.channel = channel;	//midi channel
    this.note_pool = [];
    this.num_active_notes = 0;
    this.adsr = getAdsr(channel);
    this.MAXPOLY = 20;

    for (var i = 0; i < this.MAXPOLY; i++) {
        this.note_pool[i] = {note_number: 0, velocity: 0, tStarted: 0, tEnded: -1, amplitude: 0};
    }

    this.note_on = function(note_number, velocity) {
        if (this.num_active_notes != this.MAXPOLY) {
            this.note_pool[this.num_active_notes].note_number = note_number;
            this.note_pool[this.num_active_notes].velocity = velocity;
            this.note_pool[this.num_active_notes].tStarted = t;
            this.note_pool[this.num_active_notes].tEnded = -1;	//-1 means it has not ended yet
            this.note_pool[this.num_active_notes].amplitude = 1;
            this.num_active_notes++;
        }
        else {
        }
    };

    this.note_off = function(note_number) {
        for (var i = 0; i < this.num_active_notes; i++) {
            if (note_number == this.note_pool[i].note_number) {
                this.note_pool[i].tEnded = t;
                //break;
                //this._note_off(i);
                //i--;
            }
        }
    };

    this.generate = function(t) {	//blir endret dynamisk
        return 0;
    };

    this._note_off = function(i) {
        this.num_active_notes--;
        this.note_pool[i].note_number = this.note_pool[this.num_active_notes].note_number;
        this.note_pool[i].velocity = this.note_pool[this.num_active_notes].velocity;
        this.note_pool[i].tStarted = this.note_pool[this.num_active_notes].tStarted;
        this.note_pool[i].tEnded = this.note_pool[this.num_active_notes].tEnded;
        this.note_pool[i].amplitude = this.note_pool[this.num_active_notes].amplitude;
    };

    this.envelope = function(i) {
        if (this.note_pool[i].tEnded != -1) {
            var tSinceEnd = t - this.note_pool[i].tEnded;
            if (tSinceEnd > this.adsr.r) {	//note really ended (after release)
                this._note_off(i);
                return false;
            }
            return Math.max(this.adsr.s * (1 - tSinceEnd / this.adsr.r), 0); //release phase
        }
        var tSinceStart = t - this.note_pool[i].tStarted;
        if (tSinceStart > this.adsr.a) return Math.max(1 - (tSinceStart - this.adsr.a) / this.adsr.d, this.adsr.s);  //decay/sustain phase
        return tSinceStart / this.adsr.a; //attack phase
    };
}

RATE = 44100;	//samples per second
RATE_RECIPROCAL = 1 / RATE;
A = 0.16 / 127;	//default amplitude
A3 = 0.48 / 127;	//default amplitude * 3

note2freq = new Array(128);
for (var i = 0; i < 128; i++) note2freq[i] = 220 * Math.pow(2, (i - 57) / 12);

sin_table = new Array(128);
for (var i = 0; i < 128; i++) sin_table[i] = Math.sin(.015625 * Math.PI * i);

saw_table = new Array(128);
for (var i = 0; i < 128; i++) saw_table[i] = .015625 * (64 - i);

function sin(x) {
    return sin_table[Math.floor(x % 128)];
}

function saw(x) {
    return saw_table[Math.floor(x % 128)];
}

function instruments(instrument) {
    switch (instrument) {
        default:
            return function(t) {
                this.out = 0;
                for (var i = 0; i < this.num_active_notes; i++) {
                    this.amplitude = this.envelope(i);
                    var period = note2freq[this.note_pool[i].note_number] * t * RATE_RECIPROCAL;
                    this.out += this.amplitude * A * this.note_pool[i].velocity * (
                        0.5 * saw(period * 128)
                    );
                }
                return this.out * 1.25;
            };
    }
}

function getAdsr(channel) {//a, d & r unit: samples. sustain level (s) unit: 0-1
    switch (channel) {
        default:
            return {a: 300, d: 900, s: 0.5, r: 300};
    }
}
