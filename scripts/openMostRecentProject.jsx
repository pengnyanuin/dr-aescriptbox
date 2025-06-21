(function () {
    /**
     * Open last opened project file
     *
     * These values are tested and work for Adobe AE 25.x
     * If it doesn't work for you, you can figure out your versions
     * * by navigating to %appdata%\Adobe\After Effects\[YOUR_AE_VERSION]\
     * * Open "Adobe After Effects 25.0 Prefs.txt" and find reference to what your most recent project is
     * * sectionName is title of the section where this is located, likely will include MRU somewhere in the string
     * * keyName is directly the value where the path to your most recent project file is assigned to
     */
    var sectionName = 'Most Recently Used (MRU) Search v2';
    var keyName = 'MRU Project Path ID # 0, File Path';

    var recentFile = app.preferences.getPrefAsString(sectionName, keyName);

    if (recentFile) {
        var recentProject = new File(recentFile);

        app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
        app.open(recentProject);

    } else {
        alert("No recent project files found in preferences.");
    }
})();