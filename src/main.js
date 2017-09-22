var midi = new Midi(song);
var mixer = new Mixer();
midi.add_callback(
    function(e) {
        mixer.handle_event(e);
    }
);

function noteNumberToNote(note_number) {
    var note = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return note[note_number % 12];
}

var canvas = document.getElementById('that-canvas');
var ctx = canvas.getContext('2d');

var drawEvent = function(e) {
    var midiChannel = e.midi_channel;
    var noteNumber = e.note_number;
    var gridSize = 20;
    var boxSize = 30;

    if (midiChannel === 0 && e.type == 0x9) {	//note on
        canvas.width = canvas.width;

        //Drawing notegridd
        for (var i = 0; i < gridSize + 6; i++) {
            ctx.strokeRect(10, 50 + i * boxSize, boxSize, boxSize);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(900, 50 + i * boxSize);
            ctx.lineTo(10, 50 + i * boxSize);
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.restore();

            ctx.fillText(noteNumberToNote(62 - i), 20, 70 + (i * boxSize));
        }
        ctx.fillRect(70, 50 + (19 - (noteNumber - 43)) * boxSize, boxSize, boxSize);

    }
};
midi.add_callback(drawEvent);
mixer.start();
