function drawNoteGrid(canvas, ctx) {
  // drawing notes
  for (let i = 0; i < 39; i++) {
    let y = i * 20;

    // define colors to piano tangents
    let colors = ["w", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
    let color_index = i % 12;

    if (colors[color_index] === "w") {
      ctx.fillStyle = "#fafafa";
    }
    else {
      ctx.fillStyle = "#222";
    }

    ctx.fillRect(0, y, 50, 20);
  }

  // draw line to separate piano tangent from note grid
  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, canvas.width);
  ctx.stroke();

  // drawing horizontal lines
  for (let i = 1; i < 30; i++) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    let length = canvas.width;
    let y = i * 20;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(length, y);
    ctx.stroke();
  }

  // drawing vertical lines
  /*
  for (let i = 1; i < 30; i++) {
    let length = canvas.height;
    let x = i * 300;

    ctx.moveTo(x, 0);
    ctx.lineTo(x, length);
    ctx.stroke();
  }
  */
}

function drawNote(ctx, note, channelNumber) {
  let scale = 220;
  let colors = ["#984002", "#49ef2a", "#ff9c1d", "#f034db"];

  ctx.fillStyle = colors[channelNumber];
  ctx.fillRect(50 + note.time * scale, 1420 - note.midi * 20, note.duration * scale, 20);
  ctx.strokeWidth = 1;
  ctx.strokeRect(50 + note.time * scale, 1420 - note.midi * 20, note.duration * scale, 20);
}

function draw(canvas, ctx, channels) {
  canvas.width = canvas.width;  // Reset the canvas
  ctx.globalAlpha = 0.7;

  drawNoteGrid(canvas, ctx);
  //console.log('drew notegrid')
  for (let channel of channels) {
    if (channel.isActive) {
      for (let note of channel.track.notes) {
        drawNote(ctx, note, channel.track.channelNumber);
      }
    }
  }
}
