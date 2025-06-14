var customColor = [1, 0, 0]; // Bright Red

app.beginUndoGroup("Change Mask Colors");

var comp = app.project.activeItem;

if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
    for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];
        var masks = layer.property("Masks");
        var color = masks.property(1).color;

        colorHsv = rgbToHsv(color);
        colorHsv = [colorHsv[0], 1, 1];
        colorRgb = hsvToRgb(colorHsv);

        masks.property(1).color = colorRgb;
    }
} else {
    alert("Please select at least one layer with masks.");
}

app.endUndoGroup();

function rgbToHsv(rgb) {
    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}

function hsvToRgb(hsv) {
    var h = hsv[0];
    var s = hsv[1];
    var v = hsv[2];
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [r, g, b];
}