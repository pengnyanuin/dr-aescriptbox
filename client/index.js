const csInterface = new CSInterface();

window.onload = () => {
    DrAeToolkit.init();
};

const DrAeToolkit = {
    CONFIG_LOADED: false,
    CONFIG_FILE_PATH: null,
    CONFIG_FILE_FOLDER_PATH: null,
    CONFIG: null,
    GRID_STACK_INSTANCE: null,

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
                "scripts": {}
            }
        }

        const saveEditingButton = document.getElementsByClassName('js-save-editing')[0];
        saveEditingButton.addEventListener('click', DrAeToolkit.closeAllowEditing);
        saveEditingButton.addEventListener('click', DrAeToolkit.saveGridEditing);

        const configOpenButton = document.getElementsByClassName('js-open-config')[0];
        const configCloseButton = document.getElementsByClassName('js-close-config')[0];
        const configSaveButton = document.getElementsByClassName('js-save-config')[0];
        const configDetailedSwitchButton = document.getElementsByClassName('js-allow-editing')[0];
        configOpenButton.addEventListener('click', DrAeToolkit.openConfig);
        configCloseButton.addEventListener('click', DrAeToolkit.closeConfig);
        configSaveButton.addEventListener('click', DrAeToolkit.closeConfig);
        configSaveButton.addEventListener('click', DrAeToolkit.saveConfig);
        configDetailedSwitchButton.addEventListener('click', DrAeToolkit.switchAllowEditing);

        DrAeToolkit.extensionSetup()
        DrAeToolkit.displayFeedback("Welcome to the toolkit!")
    },

    extensionSetup: async function() {
        try {
            const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
            DrAeToolkit.cleanGridStack();

            let workingScripts = [];
            const scriptsFolder = await DrAeToolkit.evalScriptAsync('draetk_getScriptsFolder()');
            const configScripts = DrAeToolkit.CONFIG.scripts;

            for (const scriptKey in configScripts) {
                const script = configScripts[scriptKey];
                const scriptPath = scriptsFolder + script.name;
                const fileExistsResult = await DrAeToolkit.evalScriptAsync('draetk_checkIfFileExists("' + DrAeToolkit.escapeString(scriptPath) + '")');
                const fileExists = fileExistsResult === '1';

                if (fileExists) {
                    workingScripts.push({
                        scriptPath: DrAeToolkit.escapeString(scriptPath),
                        buttonName: script.buttonName,
                        scriptName: script.name,
                        scriptKey: scriptKey,
                        data: script
                    })
                }
            }

            for (const script of workingScripts) {
                const button = document.createElement('button');
                const gridWrapper = document.createElement('div');
                const contentWrapper = document.createElement('div');
                button.textContent = script.buttonName;
                button.id = script.scriptName;
                button.classList.add('tk-btn');
                button.classList.add('js-grid-btn');

                gridWrapper.setAttribute('data-script-key', script.scriptKey);
                gridWrapper.classList.add('grid-stack-item');
                contentWrapper.classList.add('grid-stack-item-content');

                if (script.data.width) {
                    gridWrapper.setAttribute('gs-w', script.data.width);
                }
                if (script.data.height) {
                    gridWrapper.setAttribute('gs-h', script.data.height);
                }
                if (script.data.xPosition) {
                    gridWrapper.setAttribute('gs-x', script.data.xPosition);
                }
                if (script.data.yPosition) {
                    gridWrapper.setAttribute('gs-y', script.data.yPosition);
                }

                button.addEventListener('click', () => {
                    DrAeToolkit.displayFeedback("Run " + script.scriptName)
                    csInterface.evalScript('draetk_runScript("' + script.scriptPath + '")', (result) => {
                        DrAeToolkit.displayFeedback("Finished " + script.scriptName)
                    });
                });

                contentWrapper.appendChild(button);
                gridWrapper.appendChild(contentWrapper);
                buttonWrap.appendChild(gridWrapper);
            }

            DrAeToolkit.initGridStack();
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

            if (Object.values(configScripts).some(s => s.name === script) || Object.values(configScripts).some( s => s.name === decodeURIComponent(script))) {
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

        DrAeToolkit.closeAllowEditing();
    },

    saveConfig: function() {
        let config = JSON.parse(JSON.stringify(DrAeToolkit.CONFIG));
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const selectedScriptsList = configContent.querySelectorAll('input[type=checkbox]:checked');

        const selectedScriptsNames = new Set();
        selectedScriptsList.forEach(selectedScript => {
            selectedScriptsNames.add(selectedScript.name);

            if (config.scripts[selectedScript.name] === undefined) {
                const selectedScriptData = {
                    name: decodeURIComponent(selectedScript.name),
                    buttonName: decodeURIComponent(selectedScript.name).replace(/\.jsx$/, ''),
                    width: 1,
                    height: 1,
                    xPosition: null,
                    yPosition: null
                };

                config.scripts[selectedScript.name] = selectedScriptData;
            }
        })

        for (const configScript in config.scripts) {
            if (!selectedScriptsNames.has(configScript)) {
                delete config.scripts[configScript];
            }
        }

        if (!DrAeToolkit.saveConfigSettings(config)) {
            return;
        }

        DrAeToolkit.extensionSetup();
        DrAeToolkit.displayFeedback("Config saved!")
    },

    saveConfigSettings(config) {
        if (!DrAeToolkit.ensureFolder(DrAeToolkit.CONFIG_FILE_FOLDER_PATH)) {
            alert("Could not create config folder.");
            return false;
        }

        const result = window.cep.fs.writeFile(DrAeToolkit.CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        if (result.err !== 0) {
            alert("Error saving the config file.");
            return false;
        }

        DrAeToolkit.CONFIG = config;
        return true;
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
            const newEditNameButton = document.createElement('button');
            const editNameImg = document.createElement('img');
            newDiv.innerHTML = button.innerHTML;
            newDiv.className = button.className;
            newDiv.id = button.id;

            newDiv.classList.add('js-temporary');
            newDiv.classList.add('grid-btn');
            button.classList.add('hidden');
            newEditNameButton.classList.add('ui-rename');
            newEditNameButton.classList.add('config-btn');
            newEditNameButton.classList.add('js-temporary');
            newEditNameButton.title = 'Change name'
            editNameImg.src = './icons/edit.svg';
            editNameImg.alt = 'Edit'

            newEditNameButton.addEventListener('click', () => {
                DrAeToolkit.changeButtonName(button.parentNode.parentNode)
            });


            button.parentNode.appendChild(newDiv);
            newEditNameButton.appendChild(editNameImg);
            button.parentNode.parentNode.appendChild(newEditNameButton);
        }

        DrAeToolkit.GRID_STACK_INSTANCE.setStatic(false);
        DrAeToolkit.displayFeedback('Editing mode');

        const saveButton = document.getElementsByClassName('js-save-editing')[0];
        saveButton.classList.remove('hidden');
    },

    closeAllowEditing: function() {
        const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
        const buttons = buttonWrap.querySelectorAll('.js-grid-btn:not(.js-temporary)');
        buttonWrap.classList.remove('editing');

        for (const button of buttons) {
            button.classList.remove('hidden');

            const temporaryElements = buttonWrap.querySelectorAll('.js-temporary');
            temporaryElements.forEach((temporary) => {
                temporary.parentNode.removeChild(temporary);
            });
        }

        DrAeToolkit.GRID_STACK_INSTANCE.setStatic(true);

        DrAeToolkit.displayFeedback('Cancelled editing the grid');

        // todo detect without saving? show unsaved changes?

        const saveButton = document.getElementsByClassName('js-save-editing')[0];
        saveButton.classList.add('hidden');
    },

    saveGridEditing: function() {
        const gridItems = DrAeToolkit.GRID_STACK_INSTANCE.getGridItems();
        let config = JSON.parse(JSON.stringify(DrAeToolkit.CONFIG));

        for(const gridItem of gridItems) {
            const scriptKey = gridItem.getAttribute('data-script-key');
            const dimensions = DrAeToolkit.getGridItemDimensions(gridItem);

            if (config.scripts[scriptKey]) {
                config.scripts[scriptKey].width = dimensions.width;
                config.scripts[scriptKey].height = dimensions.height;
                config.scripts[scriptKey].xPosition = dimensions.xPosition;
                config.scripts[scriptKey].yPosition = dimensions.yPosition;
            }
        }

        DrAeToolkit.saveConfigSettings(config);
        DrAeToolkit.displayFeedback('Grid settings saved!');
    },

    getGridItemDimensions: function (element) {
        const itemWidth = element.getAttribute('gs-w');
        const itemHeight = element.getAttribute('gs-h');
        const itemXPosition = element.getAttribute('gs-x');
        const itemYPosition = element.getAttribute('gs-y');

        return {
            width: itemWidth ? itemWidth : '1',
            height: itemHeight ? itemHeight : '1',
            xPosition: itemXPosition ? itemXPosition : '0',
            yPosition: itemYPosition ? itemYPosition : '0'
        }
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
    },

    initGridStack: function () {
        // todo allow grid width and height setting
        const gridStackOptions = {
            alwaysShowResizeHandle: false,
            column: 4,
            margin: '.2rem',
            staticGrid: true,
            float: true,
            draggable: {
                scroll: false,
            }
        };
        DrAeToolkit.GRID_STACK_INSTANCE = GridStack.init(gridStackOptions);
    },

    cleanGridStack: function () {
        if (!DrAeToolkit.GRID_STACK_INSTANCE) {
            return;
        }

        const gridItems = DrAeToolkit.GRID_STACK_INSTANCE.getGridItems();
        DrAeToolkit.GRID_STACK_INSTANCE.destroy(false);

        for (const gridItem of gridItems) {
            if (gridItem.classList.contains('grid-stack-item')) {
                gridItem.parentNode.removeChild(gridItem);
            }
        }
    },

    changeButtonName: function (gridItem) {
        const button = gridItem.querySelector('.js-grid-btn:not(.js-temporary)');

        csInterface.evalScript('prompt("Enter value:", "' + button.innerHTML + '")', function(userNewButtonName) {
            if (!userNewButtonName) {
                return;
            }

            let config = JSON.parse(JSON.stringify(DrAeToolkit.CONFIG));

            if (config.scripts[gridItem.getAttribute('data-script-key')] !== undefined) {
                config.scripts[gridItem.getAttribute('data-script-key')].buttonName = userNewButtonName;
            }

            const temporaryButton = gridItem.querySelector('.js-grid-btn.js-temporary');
            button.innerHTML = userNewButtonName;
            temporaryButton.innerHTML = userNewButtonName;

            // todo save here? what is save button for then? maybe dont save?
            DrAeToolkit.saveConfigSettings(config);
            DrAeToolkit.displayFeedback('Button name changed!');
        });
    }
}


