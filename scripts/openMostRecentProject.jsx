(function () {

    // todo works for AE 2025, but what's the pref for older AEs?
    var recentFile = app.preferences.getPrefAsString("Most Recently Used (MRU) Search v2", "MRU Project Path ID # 0, File Path");

    if (recentFile) {
        var recentProject = new File(recentFile);

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        app.open(recentProject);

    } else {
        alert("No recent project files found in preferences.");
    }
})();