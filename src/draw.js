function Drawer(canvas, app) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.heightPerNote = null;
  this.numNotesInExtent = null;
  this.app = app;
}

Drawer.prototype.draw = function draw() {
  this.canvas.width = this.canvas.width;  // Reset the canvas
  this.ctx.save();
  this.ctx.globalAlpha = 0.7;

  this.numNotesInExtent = this.app.noteNumberExtent[1] - this.app.noteNumberExtent[0] + 1;
  this.heightPerNote = this.canvas.height / this.numNotesInExtent;

  this.drawNoteGrid();

  for (let channel of this.app.channels) {
    if (channel.isActive) {
      for (let note of channel.track.notes) {
        this.drawNote(note, channel.track.channelNumber);
      }
    }
  }
  this.ctx.restore();
};

Drawer.prototype.drawNoteGrid = function () {
  // Draw piano keys
  for (let noteNumber = this.app.noteNumberExtent[0]; noteNumber <= this.app.noteNumberExtent[1]; noteNumber++) {
    let y = this.getYByNoteNumber(noteNumber);

    // Define piano key colors
    let colors = ["w", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
    let color_index = noteNumber % 12;

    if (colors[color_index] === "w") {
      this.ctx.fillStyle = "#fafafa";
    }
    else {
      this.ctx.fillStyle = "#222";
    }

    this.ctx.fillRect(0, y, 50, this.heightPerNote);
  }

  // Draw line to separate piano tangent from note grid
  this.ctx.save();
  this.ctx.lineWidth = 3;
  this.ctx.beginPath();
  this.ctx.moveTo(50, 0);
  this.ctx.lineTo(50, this.canvas.width);
  this.ctx.stroke();
  this.ctx.restore();

  // Draw horizontal lines
  for (let i = 1; i < 30; i++) {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    let length = this.canvas.width;
    let y = i * this.heightPerNote;

    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(length, y);
    this.ctx.stroke();
  }
};

Drawer.prototype.drawNote = function (note, channelNumber) {
  let scale = 220;
  let colors = ["#984002", "#49ef2a", "#ff9c1d", "#f034db"];

  this.ctx.fillStyle = colors[channelNumber];
  const x = 50 + (note.time - app.time) * scale;
  const y = this.getYByNoteNumber(note.midi);
  const width = note.duration * scale;
  const height = this.heightPerNote;
  this.ctx.fillRect(x, y, width, height);
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(x, y, width, height);
};

Drawer.prototype.getYByNoteNumber = function(noteNumber) {
  const relativeNoteNumber = noteNumber - this.app.noteNumberExtent[0];
  return this.canvas.height - this.heightPerNote * relativeNoteNumber - this.heightPerNote;
};
