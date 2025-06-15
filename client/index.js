const csInterface = new CSInterface();

window.onload = () => {
    DrAeToolkit.init();
};

const DrAeToolkit = {
    CONFIG_LOADED: false,
    CONFIG_FILE_PATH: null,
    CONFIG_FILE_FOLDER_PATH: null,
    CONFIG: null,

    init: function () {
        // Get config data
        let config = null;
        const userDataPath = csInterface.getSystemPath(SystemPath.USER_DATA);
        DrAeToolkit.CONFIG_FILE_FOLDER_PATH = userDataPath + "/DrAeToolkit";
        DrAeToolkit.CONFIG_FILE_PATH = DrAeToolkit.CONFIG_FILE_FOLDER_PATH + "/config.json";
        const readConfigFileResult = window.cep.fs.readFile(DrAeToolkit.CONFIG_FILE_PATH);
        if (readConfigFileResult.err === 0) {
            DrAeToolkit.CONFIG = JSON.parse(readConfigFileResult.data);
        } else {
            // File not found, create default object
            DrAeToolkit.CONFIG = {
                "scripts": []
            }
        }

        const configOpenButton = document.getElementsByClassName('js-open-config')[0];
        const configCloseButton = document.getElementsByClassName('js-close-config')[0];
        const configSaveButton = document.getElementsByClassName('js-save-config')[0];
        const configDetailedSwitchButton = document.getElementsByClassName('js-allow-editing')[0];
        configOpenButton.addEventListener('click', DrAeToolkit.openConfig);
        configCloseButton.addEventListener('click', DrAeToolkit.closeConfig);
        configSaveButton.addEventListener('click', DrAeToolkit.saveConfig);
        configSaveButton.addEventListener('click', DrAeToolkit.closeConfig);
        configDetailedSwitchButton.addEventListener('click', DrAeToolkit.switchAllowEditing);

        DrAeToolkit.extensionSetup()
        DrAeToolkit.displayFeedback("Welcome to the toolkit!")
    },

    extensionSetup: async function() {
        try {
            const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
            buttonWrap.innerHTML = '';

            let workingScripts = [];
            const scriptsFolder = await DrAeToolkit.evalScriptAsync('draetk_getScriptsFolder()');
            const configScripts = DrAeToolkit.CONFIG.scripts;

            for (const script of configScripts) {
                const scriptPath = scriptsFolder + script;
                const fileExistsResult = await DrAeToolkit.evalScriptAsync('draetk_checkIfFileExists("' + DrAeToolkit.escapeString(scriptPath) + '")');
                const fileExists = fileExistsResult === '1';

                if (fileExists) {
                    workingScripts.push({
                        'scriptPath': DrAeToolkit.escapeString(scriptPath),
                        'buttonName': script.replace(/\.jsx$/, ''),
                        'scriptName': script
                    })
                }
            }

            for (const script of workingScripts) {
                const button = document.createElement('button');
                button.textContent = script.buttonName;
                button.id = script.buttonName;
                button.classList.add('tk-btn');
                button.classList.add('js-grid-btn');

                button.addEventListener('click', () => {
                    DrAeToolkit.displayFeedback("Run " + script.scriptName)
                    csInterface.evalScript('draetk_runScript("' + script.scriptPath + '")', (result) => {
                        DrAeToolkit.displayFeedback("Finished " + script.scriptName)
                    });
                });

                buttonWrap.appendChild(button);
            }

        } catch (error) {
            alert(error);
        }
    },

    configSetup: async function () {
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const scriptsFilesResult = await DrAeToolkit.evalScriptAsync('draetk_getScriptsFolderContent()');
        const configScripts = DrAeToolkit.CONFIG.scripts;
        const scriptsFiles = JSON.parse(scriptsFilesResult);

        for (const script of scriptsFiles) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const textWrap = document.createElement('span');
            const checkboxWrap = document.createElement('span');
            checkbox.type = 'checkbox';
            checkbox.name = script;
            textWrap.innerText = decodeURIComponent(script);
            checkboxWrap.classList.add('checkbox-wrap');
            textWrap.classList.add('text-wrap');

            configContent.appendChild(label);
            label.appendChild(checkboxWrap);
            label.appendChild(textWrap);
            checkboxWrap.appendChild(checkbox);

            if (configScripts.includes(script) || configScripts.includes(decodeURIComponent(script))) {
                checkbox.checked = true;
            }
        }
    },

    escapeString: function (string) {
        return string.replace(/\\/g, '\\\\');
    },

    evalScriptAsync: function(script) {
        return new Promise((resolve, reject) => {
            csInterface.evalScript(script, (result) => {
                if (result === 'EvalScript error.') {
                    reject(new Error('ExtendScript evalScript error'));
                } else {
                    resolve(result);
                }
            });
        });
    },

    openConfig: function() {
        const configWrap = document.getElementsByClassName('js-config')[0];
        configWrap.classList.add('open');
        if (!DrAeToolkit.CONFIG_LOADED) {
            DrAeToolkit.configSetup().then(() => {
                DrAeToolkit.CONFIG_LOADED = true;
            });
        }
    },

    closeConfig: function() {
        const configWrap = document.getElementsByClassName('js-config')[0];
        configWrap.classList.remove('open');
    },

    saveConfig: function() {
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const selectedScriptsList = configContent.querySelectorAll('input[type=checkbox]:checked');

        let selectedScripts = [];
        selectedScriptsList.forEach(selectedScript => {
            selectedScripts.push(decodeURIComponent(selectedScript.name));
        })

        if (!DrAeToolkit.ensureFolder(DrAeToolkit.CONFIG_FILE_FOLDER_PATH)) {
            alert("Could not create config folder.");
            return;
        }

        DrAeToolkit.CONFIG.scripts = selectedScripts;
        const result = window.cep.fs.writeFile(DrAeToolkit.CONFIG_FILE_PATH, JSON.stringify(DrAeToolkit.CONFIG, null, 2));
        if (result.err !== 0) {
            alert("Error saving the config file.");
        }

        DrAeToolkit.extensionSetup();
        DrAeToolkit.displayFeedback("Config saved!")
    },

    switchAllowEditing: function () {
        const configContent = document.getElementsByClassName('js-buttons-wrap')[0];

        if (configContent.classList.contains('editing')) {
            DrAeToolkit.closeAllowEditing();
        } else {
            DrAeToolkit.openAllowEditing();
        }
    },

    openAllowEditing: function() {
        const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
        const buttons = buttonWrap.querySelectorAll('.js-grid-btn');
        buttonWrap.classList.add('editing');


        for (const button of buttons) {
            const newDiv = document.createElement('div');
            newDiv.innerHTML = button.innerHTML;
            newDiv.className = button.className;
            newDiv.id = button.id;

            newDiv.classList.add('js-editing-temporary');

            button.classList.add('hidden');
            button.parentNode.insertBefore(newDiv, button.nextSibling);
        }

        DrAeToolkit.displayFeedback("Editing mode")
    },

    closeAllowEditing: function() {
        const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
        const divs = buttonWrap.querySelectorAll('.js-editing-temporary');
        const buttons = buttonWrap.querySelectorAll('.js-grid-btn:not(.js-editing-temporary)');
        buttonWrap.classList.remove('editing');

        for (const button of buttons) {
            button.classList.remove('hidden');
        }

        for (const div of divs) {
            div.remove();
        }

        DrAeToolkit.displayFeedback("Finished editing the grid")
    },

    ensureFolder: function(path) {
        const result = window.cep.fs.readdir(path);
        if (result.err === 0) {
            // Folder exists
            return true;
        } else {
            const createResult = window.cep.fs.makedir(path);
            return createResult.err === 0;
        }
    },

    displayFeedback: function(string) {
        const feedbackWrapper = document.getElementsByClassName('js-feedback')[0];
        feedbackWrapper.innerText = string;
    }
}


