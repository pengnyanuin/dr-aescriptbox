(function () {
    // This works for Adobe AE 25.0.0
    // If it doesn't work you can figure out your versions
    // * by navigating to %appdata%\Adobe\After Effects\[YOUR_AE_VERSION]\
    // * Open "Adobe After Effects 25.0 Prefs.txt" and find reference to what your most recent project is
    // * First value in next line is title of the category where this is located, likely will include MRU somewhere
    // * Second value is directly the value where the path to your most recent project file is assigned to
    var recentFile = app.preferences.getPrefAsString("Most Recently Used (MRU) Search v2", "MRU Project Path ID # 0, File Path");

    if (recentFile) {
        var recentProject = new File(recentFile);

        app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
        app.open(recentProject);

    } else {
        alert("No recent project files found in preferences.");
    }
})();