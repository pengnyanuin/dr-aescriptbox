(function () {
    /**
     * Apply loopOut() expression to time remap and set up keyframes so the layer loops properly
     *
     * Version: 1.0.0
     */
    var activeComp = app.project.activeItem;
    var selectedLayers = activeComp.selectedLayers;

    var frameDuration = 1 / activeComp.frameRate;

    app.beginUndoGroup('Apply loop out expression');

    for (var i = 0; i < selectedLayers.length; i++) {
        var selectedLayer = selectedLayers[i];

        if (!selectedLayer.canSetTimeRemapEnabled || selectedLayer.timeRemapEnabled) {
            continue;
        }

        selectedLayer.timeRemapEnabled = true;

        var timeRemap = selectedLayer.property("ADBE Time Remapping");

        if (timeRemap.canSetExpression) {
            timeRemap.expression = 'loopOut();';

            var numKeys = timeRemap.numKeys;

            if (numKeys >= 2) {
                var firstKeyValue = timeRemap.keyValue(1);
                var lastKeyTime = timeRemap.keyTime(numKeys);

                var previousFromLastKeyTime = lastKeyTime - frameDuration;

                timeRemap.addKey(previousFromLastKeyTime);
                timeRemap.setValueAtTime(lastKeyTime, firstKeyValue);
            }
        }
    }

    app.endUndoGroup();

    app.activeViewer.setActive();
})();