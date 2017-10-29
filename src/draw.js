function Drawer(canvas) {
  this.canvas = canvas;
  this.ctx = this.canvas.getContext('2d');
}

Drawer.prototype.draw = function draw(channels) {
  this.canvas.width = this.canvas.width;  // Reset the canvas
  this.ctx.save();
  this.ctx.globalAlpha = 0.7;

  this.drawNoteGrid();

  for (let channel of channels) {
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
  for (let i = 0; i < 39; i++) {
    let y = i * 20;

    // Define piano key colors
    let colors = ["w", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
    let color_index = i % 12;

    if (colors[color_index] === "w") {
      this.ctx.fillStyle = "#fafafa";
    }
    else {
      this.ctx.fillStyle = "#222";
    }

    this.ctx.fillRect(0, y, 50, 20);
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
    let y = i * 20;

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
  const y = 1420 - note.midi * 20;
  const width = note.duration * scale;
  const height = 20;
  this.ctx.fillRect(x, y, width, height);
  this.ctx.lineWidth = 2;
  this.ctx.strokeRect(x, y, width, height);
};
