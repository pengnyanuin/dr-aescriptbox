(function () {
    /**
     * Pre-compose each selected layer individually
     *
     * moveAllAttributesIntoTheNewComposition TRUE if all attributes to new layer
     * adjustCompositionDuration TRUE if pre-comp should adjust to pre-comped layer
     */
    var moveAllAttributesIntoTheNewComposition = true;
    var adjustCompositionDuration = true; // only works if moveAllAttributesIntoTheNewComposition is also true

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert('Please select a composition.');
    } else if (comp.selectedLayers.length === 0) {
        alert('Please select at least one layer.');
    } else {
        app.beginUndoGroup('Pre-compose each layer individually');

        var selectedLayers = comp.selectedLayers;

        for (var i = selectedLayers.length - 1; i >= 0; i--) {
            var layer = selectedLayers[i];

            var inPoint = layer.inPoint;
            var outPoint = layer.outPoint;
            var potentialCompNameNumber = 1;
            var potentialCompName = layer.name + ' Comp ' + potentialCompNameNumber;

            while (findCompWithName(potentialCompName)) {
                potentialCompNameNumber++;
                potentialCompName = layer.name + ' Comp ' + potentialCompNameNumber;
            }

            var newComp = comp.layers.precompose([layer.index], potentialCompName, moveAllAttributesIntoTheNewComposition);

            if (moveAllAttributesIntoTheNewComposition && adjustCompositionDuration) {
                comp.selectedLayers[0].startTime = inPoint;

                var newDuration = outPoint - inPoint;
                newComp.duration = newDuration;

                for (var k = 1; k <= newComp.numLayers; k++) {
                    var innerLayer = newComp.layer(k);
                    innerLayer.startTime -= inPoint;
                }
            }
        }

        app.endUndoGroup();
    }

    function findCompWithName(compName) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) {
                return item;
            }
        }

        return null;
    }
})();