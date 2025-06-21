(function () {
    /**
     * Set mask feather on all selected masks. If layer is selected, it is applied to all masks on that layer.
     *
     * Version: 1.0.0
     *
     * Specify specificColor for a specific color to be applied instead of adjusting the randomly selected one
     */
    var specificMaskFeather = 0.3; // number || [number, number]

    if (isPositiveNumber(specificMaskFeather)) {
        specificMaskFeather = [specificMaskFeather, specificMaskFeather];
    }
    var activeItem = app.project.activeItem;

    if (activeItem && activeItem instanceof CompItem && activeItem.selectedLayers.length > 0) {
        app.beginUndoGroup('Change mask feather');

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
                        masks.property(idx).property('Mask Feather').setValue(specificMaskFeather);
                    }
                } else {
                    for (var j = 1; j <= masks.numProperties; j++) {
                        masks.property(j).property('Mask Feather').setValue(specificMaskFeather);
                    }
                }
            }
        }

        app.endUndoGroup();
    }

    function isPositiveNumber(value) {
        return (
            typeof value === "number" &&
            isFinite(value) &&
            value > 0
        );
    }
})();