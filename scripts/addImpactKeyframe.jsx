(function () {
    /**
     * Add keyframe at current, previous and next frame of selected properties
     *
     * Version: 1.0.0
     *
     * openEditValueOnSingleProperty TRUE if you want to instantly open edit value prompt if only single property was selected
     * openPropertyType enum of property type this should apply to. NULL if all types. Array for multiple types.
     *
     * Values help:
     * * PropertyValueType.COLOR - color
     * * PropertyValueType.OneD - single value, (opacity)
     * * PropertyValueType.TwoD - double value, (scale)
     * * PropertyValueType.TwoD_SPATIAL - double value spatial, (2D position)
     * * PropertyValueType.ThreeD - triple value (3D rotation)
     * * PropertyValueType.ThreeD_SPATIAL (3D position)
     * * PropertyValueType.SHAPE (mask)
     * * PropertyValueType.TEXT_DOCUMENT (source text)
     */
    var openEditValueOnSingleProperty = true;
    var openPropertyType = PropertyValueType.COLOR; // null || enum || array

    var activeComp = app.project.activeItem;
    var selectedProperties = activeComp.selectedProperties;

    var currentTime = activeComp.time;
    var frameDuration = 1 / activeComp.frameRate;
    var previousFrameTime = currentTime - frameDuration;
    var nextFrameTime = currentTime + frameDuration;

    if (selectedProperties.length < 1) {
        return;
    }

    app.beginUndoGroup('Add impact keyframe');

    for (var i = 0; i < selectedProperties.length; i++) {
        var selectedProperty = selectedProperties[i];

        if (selectedProperty.canVaryOverTime === true) {
            selectedProperty.addKey(previousFrameTime);
            var currentKeyframe = selectedProperty.addKey(currentTime);
            selectedProperty.addKey(nextFrameTime);

            // Deselect all keys
            for (var k = 1; k <= selectedProperty.numKeys; k++) {
                selectedProperty.setSelectedAtKey(k, false);
            }

            selectedProperty.setSelectedAtKey(currentKeyframe, true);
        }
    }

    app.endUndoGroup();

    if (
        openEditValueOnSingleProperty &&
        selectedProperties.length === 1
    ) {
        var propertyTypeFound = false;
        if (openPropertyType instanceof Array) {
            for (var j = 0; j < openPropertyType.length; j++) {
                if (openPropertyType[j] === selectedProperties[0].propertyValueType) {
                    propertyTypeFound = true;
                    break;
                }
            }
        }

        if (
            !openPropertyType ||
            (!(openPropertyType instanceof Array) && selectedProperties[0].propertyValueType === openPropertyType) ||
            (openPropertyType instanceof Array && propertyTypeFound)
        ) {
            app.executeCommand(2240); // Edit value command
        }
    }

    app.activeViewer.setActive();
})();