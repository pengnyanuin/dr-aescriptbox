const csInterface = new CSInterface();

window.onload = () => {
    DrAeScriptBox.init();
};

const DrAeScriptBox = {
    CONFIG_LOADED: false,
    CONFIG_FILE_PATH: null,
    CONFIG_FILE_FOLDER_PATH: null,
    CONFIG: null,
    GRID_STACK_INSTANCE: null,

    init: function () {
        // Get config data
        let config = null;
        const userDataPath = csInterface.getSystemPath(SystemPath.USER_DATA);
        DrAeScriptBox.CONFIG_FILE_FOLDER_PATH = userDataPath + "/DrAeScriptBox";
        DrAeScriptBox.CONFIG_FILE_PATH = DrAeScriptBox.CONFIG_FILE_FOLDER_PATH + "/config.json";
        const readConfigFileResult = window.cep.fs.readFile(DrAeScriptBox.CONFIG_FILE_PATH);
        if (readConfigFileResult.err === 0) {
            DrAeScriptBox.CONFIG = JSON.parse(readConfigFileResult.data);
        } else {
            // File not found, create default object
            DrAeScriptBox.CONFIG = {
                "options": {
                    "columns": 4,
                    "cellWidth": null,
                    "cellHeight": null
                },
                "scripts": {}
            }
        }

        const saveEditingButton = document.getElementsByClassName('js-save-editing')[0];
        saveEditingButton.addEventListener('click', DrAeScriptBox.closeAllowEditing);
        saveEditingButton.addEventListener('click', DrAeScriptBox.saveGridEditing);

        const configOpenButton = document.getElementsByClassName('js-open-config')[0];
        const configCloseButton = document.getElementsByClassName('js-close-config')[0];
        const configSaveButton = document.getElementsByClassName('js-save-config')[0];
        const configDetailedSwitchButton = document.getElementsByClassName('js-allow-editing')[0];
        configOpenButton.addEventListener('click', DrAeScriptBox.openConfig);
        configCloseButton.addEventListener('click', DrAeScriptBox.closeConfig);
        configSaveButton.addEventListener('click', DrAeScriptBox.closeConfig);
        configSaveButton.addEventListener('click', DrAeScriptBox.saveConfig);
        configDetailedSwitchButton.addEventListener('click', DrAeScriptBox.switchAllowEditing);

        DrAeScriptBox.extensionSetup()
        DrAeScriptBox.displayFeedback("Welcome!")
    },

    extensionSetup: async function() {
        try {
            const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
            DrAeScriptBox.cleanGridStack();

            let workingScripts = [];
            const scriptsFolder = await DrAeScriptBox.evalScriptAsync('draesb_getScriptsFolder()');
            const configScripts = DrAeScriptBox.CONFIG.scripts;

            for (const scriptKey in configScripts) {
                const script = configScripts[scriptKey];
                const scriptPath = scriptsFolder + script.name;
                const fileExistsResult = await DrAeScriptBox.evalScriptAsync('draesb_checkIfFileExists("' + DrAeScriptBox.escapeString(scriptPath) + '")');
                const fileExists = fileExistsResult === '1';

                if (fileExists) {
                    workingScripts.push({
                        scriptPath: DrAeScriptBox.escapeString(scriptPath),
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
                    DrAeScriptBox.displayFeedback("Run " + script.scriptName)
                    csInterface.evalScript('draesb_runScript("' + script.scriptPath + '")', (result) => {
                        DrAeScriptBox.displayFeedback("Finished " + script.scriptName)
                    });
                });

                contentWrapper.appendChild(button);
                gridWrapper.appendChild(contentWrapper);
                buttonWrap.appendChild(gridWrapper);
            }

            DrAeScriptBox.initGridStack();
        } catch (error) {
            alert(error);
        }
    },

    configSetup: async function () {
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const configOptions = document.querySelectorAll('.js-config-option');
        const scriptsFilesResult = await DrAeScriptBox.evalScriptAsync('draesb_getScriptsFolderContent()');
        const configScripts = DrAeScriptBox.CONFIG.scripts;
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

        for (const option of configOptions) {
            option.value = DrAeScriptBox.CONFIG.options[option.name]
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
        if (!DrAeScriptBox.CONFIG_LOADED) {
            DrAeScriptBox.configSetup().then(() => {
                DrAeScriptBox.CONFIG_LOADED = true;
            });
        }
    },

    closeConfig: function() {
        const configWrap = document.getElementsByClassName('js-config')[0];
        configWrap.classList.remove('open');

        DrAeScriptBox.closeAllowEditing();
    },

    saveConfig: function() {
        let config = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG));
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const configOptions = document.querySelectorAll('.js-config-option');
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

        for (const option of configOptions) {
            let newValue = option.value;

            if (newValue === '' && option.getAttribute('data-nullable')) {
                newValue = null;
            } else if (option.type === 'number') {
                newValue = option.value ? parseInt(option.value) : 0;

                const min = option.getAttribute('min');
                const max = option.getAttribute('max');

                if (min && (newValue < parseInt(min))) {
                    newValue = min;
                    option.value = newValue;
                }
                if (max && (newValue > parseInt(max))) {
                    newValue = max;
                }
            }

            config.options[option.name] = newValue;
            option.value = newValue;
        }

        if (!DrAeScriptBox.saveConfigSettings(config)) {
            return;
        }

        DrAeScriptBox.extensionSetup();
        DrAeScriptBox.displayFeedback("Config saved!")
    },

    saveConfigSettings(config) {
        if (!DrAeScriptBox.ensureFolder(DrAeScriptBox.CONFIG_FILE_FOLDER_PATH)) {
            alert("Could not create config folder.");
            return false;
        }

        const result = window.cep.fs.writeFile(DrAeScriptBox.CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        if (result.err !== 0) {
            alert("Error saving the config file.");
            return false;
        }

        DrAeScriptBox.CONFIG = config;
        return true;
    },

    switchAllowEditing: function () {
        const configContent = document.getElementsByClassName('js-buttons-wrap')[0];

        if (configContent.classList.contains('editing')) {
            DrAeScriptBox.closeAllowEditing();
        } else {
            DrAeScriptBox.openAllowEditing();
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
                DrAeScriptBox.changeButtonName(button.parentNode.parentNode)
            });


            button.parentNode.appendChild(newDiv);
            newEditNameButton.appendChild(editNameImg);
            button.parentNode.parentNode.appendChild(newEditNameButton);
        }

        DrAeScriptBox.GRID_STACK_INSTANCE.setStatic(false);
        DrAeScriptBox.displayFeedback('Editing mode');

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

        DrAeScriptBox.GRID_STACK_INSTANCE.setStatic(true);

        DrAeScriptBox.displayFeedback('Cancelled editing the grid');

        // todo detect without saving? show unsaved changes?

        const saveButton = document.getElementsByClassName('js-save-editing')[0];
        saveButton.classList.add('hidden');
    },

    saveGridEditing: function() {
        const gridItems = DrAeScriptBox.GRID_STACK_INSTANCE.getGridItems();
        let config = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG));

        for(const gridItem of gridItems) {
            const scriptKey = gridItem.getAttribute('data-script-key');
            const dimensions = DrAeScriptBox.getGridItemDimensions(gridItem);

            if (config.scripts[scriptKey]) {
                config.scripts[scriptKey].width = dimensions.width;
                config.scripts[scriptKey].height = dimensions.height;
                config.scripts[scriptKey].xPosition = dimensions.xPosition;
                config.scripts[scriptKey].yPosition = dimensions.yPosition;
            }
        }

        DrAeScriptBox.saveConfigSettings(config);
        DrAeScriptBox.displayFeedback('Grid settings saved!');
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
            column: DrAeScriptBox.CONFIG.options.columns,
            cellHeight: DrAeScriptBox.CONFIG.options.cellHeight ? DrAeScriptBox.CONFIG.options.cellHeight : 'auto',
            margin: '.2rem',
            staticGrid: true,
            float: false, // todo allow floating option
            draggable: {
                scroll: false,
            }
        };
        DrAeScriptBox.GRID_STACK_INSTANCE = GridStack.init(gridStackOptions);
    },

    cleanGridStack: function () {
        if (!DrAeScriptBox.GRID_STACK_INSTANCE) {
            return;
        }

        const gridItems = DrAeScriptBox.GRID_STACK_INSTANCE.getGridItems();
        DrAeScriptBox.GRID_STACK_INSTANCE.destroy(false);

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

            let config = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG));

            if (config.scripts[gridItem.getAttribute('data-script-key')] !== undefined) {
                config.scripts[gridItem.getAttribute('data-script-key')].buttonName = userNewButtonName;
            }

            const temporaryButton = gridItem.querySelector('.js-grid-btn.js-temporary');
            button.innerHTML = userNewButtonName;
            temporaryButton.innerHTML = userNewButtonName;

            // todo save here? what is save button for then? maybe dont save?
            DrAeScriptBox.saveConfigSettings(config);
            DrAeScriptBox.displayFeedback('Button name changed!');
        });
    }
}


