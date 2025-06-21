(function () {
    /**
     * Adjust mask color on selected masks to be full saturation and brightness. If layer is selected, it is applied
     * to all masks on that layer.
     *
     * Version: 1.0.0
     *
     * Specify specificColor for a specific color to be applied instead of adjusting the randomly selected one
     */
    var specificColor = false; // false || [0, 0, 0] - [1, 1, 1]

    var activeItem = app.project.activeItem;

    if (activeItem && activeItem instanceof CompItem && activeItem.selectedLayers.length > 0) {
        app.beginUndoGroup('Change mask color');

        for (var i = 0; i < activeItem.selectedLayers.length; i++) {
            var layer = activeItem.selectedLayers[i];
            var masks = layer.property('Masks');

            if (masks && masks.numProperties > 0) {
                var maskIndicesToChange = [];

                // Find selected masks
                for (var j = 1; j <= masks.numProperties; j++) {
                    var mask = masks.property(j);
                    if (mask.selected) {
                        maskIndicesToChange.push(j);
                    }
                }

                if (maskIndicesToChange.length > 0) {
                    for (var k = 0; k < maskIndicesToChange.length; k++) {
                        var idx = maskIndicesToChange[k];

                        if (specificColor) {
                            var colorRgb = specificColor;
                        } else {
                            var color = masks.property(idx).color;
                            var colorHsv = rgbToHsv(color);
                            colorHsv = [colorHsv[0], 1, 1];
                            var colorRgb = hsvToRgb(colorHsv);
                        }

                        masks.property(idx).color = colorRgb;
                    }
                } else {
                    for (var j = 1; j <= masks.numProperties; j++) {
                        if (specificColor) {
                            var colorRgb = specificColor;
                        } else {
                            var color = masks.property(j).color;
                            var colorHsv = rgbToHsv(color);
                            colorHsv = [colorHsv[0], 1, 1];
                            var colorRgb = hsvToRgb(colorHsv);

                        }

                        masks.property(j).color = colorRgb;
                    }
                }
            }
        }

        app.endUndoGroup();
    }

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
})();