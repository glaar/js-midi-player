function drawNoteGrid(ctx) {
    // drawing notes
    for (var i = 0; i < 39; i++) {

        var y = i * 20;

        // define colors to notes
        var colors = ["w", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
        var color_index = i % 12;

        if (colors[color_index] === "w") {
            ctx.fillStyle = "#ffffff";
        }
        else {
            ctx.fillStyle = "#000000";
        }

        ctx.fillRect(0, y, 50, 20);
    }

    //draw line to define where notekeys end
    ctx.moveTo(50, 0);
    ctx.lineTo(50, canvas.width);
    ctx.stroke();


    // drawing horizontal lines
    for (var i = 1; i < 40; i++) {

        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        var length = canvas.width;
        var y = i * 20;

        ctx.moveTo(0, y);
        ctx.lineTo(length, y);
        ctx.stroke();
    }

    // drawing vertical lines
    for (var i = 1; i < 30; i++) {

        var length = canvas.height;
        var x = i * 300;

        ctx.moveTo(x, 0);
        ctx.lineTo(x, length);
        ctx.stroke();
    }

}
function drawNote(tone, channelNumber) {

    let scale = 300;
    let colors = ["#984002", "#49ef2a", "#ff9c1d", "#f034db"];



    /* var notes = ["C", "b", "w", "b", "w", "b", "w", "w", "b", "w", "b", "w"];
    var note_index = i % 12;

    if (colors[color_index] === "w") {
        ctx.fillStyle = "#ffffff";
    }
    else {
        ctx.fillStyle = "#000000";
    }
    */

    ctx.fillStyle = colors[channelNumber];
    ctx.fillRect(tone.time * scale, 1500 - tone.midi * 20, tone.duration * scale, 20);

}
