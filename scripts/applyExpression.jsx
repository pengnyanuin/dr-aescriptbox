(function () {
    /**
     * Apply loopOut() expression to time remap and set up keyframes so the layer loops properly
     *
     * Version: 1.0.0
     *
     * Expression to apply
     */
    var expression = 'wiggle(10, 10);';

    var activeComp = app.project.activeItem;
    var selectedProperties = activeComp.selectedProperties;

    app.beginUndoGroup('Apply expression');

    for (var i = 0; i < selectedProperties.length; i++) {
        var selectedProperty = selectedProperties[i];

        if (!selectedProperty.canSetExpression) {
            continue;
        }

        selectedProperty.expression = expression;
    }

    app.endUndoGroup();

    app.activeViewer.setActive();
})();