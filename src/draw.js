function Drawer(canvas, app) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
  this.heightPerNote = null;
  this.numNotesInExtent = null;
  this.app = app;
  this.keyColors = ["w", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
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
        const isWithinBounds = this.drawNote(note, channel.track.channelNumber);
        if (!isWithinBounds) {
          // No need to keep drawing if the rest of the notes are out of bounds
          break;
        }
      }
    }
  }
  this.ctx.restore();
};

Drawer.prototype.drawNoteGrid = function () {
  for (let noteNumber = this.app.noteNumberExtent[0]; noteNumber <= this.app.noteNumberExtent[1]; noteNumber++) {
    let y = this.getYByNoteNumber(noteNumber);

    // Draw piano key
    let colorIndex = noteNumber % 12;
    if (this.keyColors[colorIndex] === "w") {
      this.ctx.fillStyle = "#fafafa";
    } else {
      this.ctx.fillStyle = "#222";
    }
    this.ctx.fillRect(0, y, 50, this.heightPerNote);

    // Draw horizontal grid line
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, y - 1, this.canvas.width, 2);
    this.ctx.restore();
  }

  // Draw line to separate piano tangent from note grid
  this.ctx.fillRect(50, 0, 3, this.canvas.height);
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
  this.ctx.lineWidth = 1;
  this.ctx.strokeRect(x, y, width, height);

  return x < this.canvas.width;  // false if out of bounds
};

Drawer.prototype.getYByNoteNumber = function(noteNumber) {
  const relativeNoteNumber = noteNumber - this.app.noteNumberExtent[0];
  return this.canvas.height - this.heightPerNote * relativeNoteNumber - this.heightPerNote;
};
