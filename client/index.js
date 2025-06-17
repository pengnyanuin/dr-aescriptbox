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
                "ver": "1.0",
                "options": {
                    "columns": 2,
                    "cellWidth": null,
                    "cellHeight": 30
                },
                "scripts": {}
            }
        }

        const configOpenButton = document.getElementsByClassName('js-open-config')[0];
        const configCloseButton = document.getElementsByClassName('js-close-config')[0];
        const configSaveButton = document.getElementsByClassName('js-save-config')[0];
        const configDetailedOpenButton = document.getElementsByClassName('js-allow-editing')[0];
        const configDetailedCloseButton = document.getElementsByClassName('js-close-editing')[0];
        configOpenButton.addEventListener('click', DrAeScriptBox.openConfig);
        configCloseButton.addEventListener('click', DrAeScriptBox.closeConfig);
        configSaveButton.addEventListener('click', DrAeScriptBox.closeConfig);
        configSaveButton.addEventListener('click', DrAeScriptBox.saveConfig);
        configDetailedOpenButton.addEventListener('click', DrAeScriptBox.openAllowEditing);
        configDetailedCloseButton.addEventListener('click', DrAeScriptBox.closeAllowEditing);

        DrAeScriptBox.extensionSetup()
        DrAeScriptBox.displayFeedback("Welcome!")
    },

    extensionSetup: async function() {
        try {
            const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
            buttonWrap.classList.remove('empty');
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

            if (workingScripts.length < 1) {
                buttonWrap.classList.add('empty');
                const welcomeMessageWrapper = document.createElement('div');
                const welcomeMessageButton = document.createElement('button');
                const welcomeMessageButtonText = document.createElement('span');
                const welcomeMessageButtonImage = document.createElement('img');
                const welcomeMessageText = document.createElement('span');
                welcomeMessageWrapper.classList.add('welcome-message');
                welcomeMessageWrapper.classList.add('js-welcome-message');
                welcomeMessageButton.classList.add('welcome-message__button');
                welcomeMessageButton.classList.add('btn');
                welcomeMessageButton.classList.add('btn--icon');
                welcomeMessageButton.classList.add('js-open-config');
                welcomeMessageText.classList.add('welcome-message__text');
                welcomeMessageText.innerHTML = 'Welcome to the AE Script Box. To start open settings and select the buttons you want to display.';
                welcomeMessageButtonImage.src = './icons/config.svg';
                welcomeMessageButtonText.innerHTML = 'Open settings';

                welcomeMessageButton.appendChild(welcomeMessageButtonImage);
                welcomeMessageButton.appendChild(welcomeMessageButtonText);
                welcomeMessageWrapper.appendChild(welcomeMessageText);
                welcomeMessageWrapper.appendChild(welcomeMessageButton);
                buttonWrap.appendChild(welcomeMessageWrapper);

                welcomeMessageButton.addEventListener('click', DrAeScriptBox.openConfig);
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

    openAllowEditing: function() {
        const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
        const buttons = buttonWrap.querySelectorAll('.js-grid-btn');
        buttonWrap.classList.add('editing');
        document.body.classList.add('editing');

        for (const button of buttons) {
            const newElement = document.createElement('input');
            const newEditNameButton = document.createElement('button');
            const editNameImg = document.createElement('img');
            newElement.value = button.innerHTML;
            newElement.className = button.className;
            newElement.type = 'text';
            newElement.id = button.id;

            newElement.classList.add('js-temporary');
            newElement.classList.add('grid-btn');
            newElement.classList.add('disabled');
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


            button.parentNode.appendChild(newElement);
            newEditNameButton.appendChild(editNameImg);
            button.parentNode.parentNode.appendChild(newEditNameButton);
        }

        DrAeScriptBox.GRID_STACK_INSTANCE.setStatic(false);
        DrAeScriptBox.displayFeedback('Editing mode');

        const exitButton = document.getElementsByClassName('js-close-editing')[0];
        const editingButton = document.getElementsByClassName('js-allow-editing')[0];
        exitButton.classList.remove('hidden');
        editingButton.classList.add('hidden');
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

        const closeButton = document.getElementsByClassName('js-close-editing')[0];
        const editingButton = document.getElementsByClassName('js-allow-editing')[0];
        closeButton.classList.add('hidden');
        editingButton.classList.remove('hidden');
        buttonWrap.classList.remove('editing');
        document.body.classList.remove('editing');
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
        const configContent = document.getElementsByClassName('js-buttons-wrap')[0];

        let gridStackWidthStyle = 'auto';
        if (DrAeScriptBox.CONFIG.options.cellWidth) {
            const columns = parseInt(DrAeScriptBox.CONFIG.options.columns);
            const cellWidth = parseInt(DrAeScriptBox.CONFIG.options.cellWidth);
            let columnsWidth = cellWidth * columns;
            columnsWidth = columnsWidth + (6 * columns);

            gridStackWidthStyle = columnsWidth + 'px';
        }
        configContent.style.width = gridStackWidthStyle;

        let gridStackHeight = 'auto';
        if (DrAeScriptBox.CONFIG.options.cellHeight) {
            const cellHeight = parseInt(DrAeScriptBox.CONFIG.options.cellHeight);

            gridStackHeight = cellHeight + 6;
        }

        const gridStackOptions = {
            alwaysShowResizeHandle: false,
            column: DrAeScriptBox.CONFIG.options.columns,
            cellHeight: gridStackHeight,
            margin: '3px',
            staticGrid: true,
            float: false, // todo allow floating option?
            draggable: {
                scroll: false,
            }
        };
        DrAeScriptBox.GRID_STACK_INSTANCE = GridStack.init(gridStackOptions);

        DrAeScriptBox.GRID_STACK_INSTANCE.on('change', function(event, items) {
            DrAeScriptBox.saveGridEditing();
        });
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

        const welcomeMessage = document.querySelector('.js-welcome-message');
        if (welcomeMessage) {
            welcomeMessage.parentNode.removeChild(welcomeMessage);
        }
    },

    changeButtonName: function (gridItem) {
        const temporaryButton = gridItem.querySelector('.js-grid-btn.js-temporary');
        gridItem.classList.add('editing-name');
        temporaryButton.parentNode.classList.add('editing');
        temporaryButton.classList.remove('disabled');
        temporaryButton.disabled = false;
        temporaryButton.focus();

        temporaryButton.addEventListener('keydown', DrAeScriptBox.saveButtonNameOnEnterEvent);
        temporaryButton.addEventListener('blur', DrAeScriptBox.saveButtonNames);

        DrAeScriptBox.displayFeedback('Enter new button name...');
    },

    saveButtonNameOnEnterEvent: function (event) {
        if (event.key === 'Enter') {
            DrAeScriptBox.saveButtonNames();
        }
    },

    saveButtonNames: function () {
        const temporaryGridContentEditing = document.querySelectorAll('.js-buttons-wrap .grid-stack-item-content.editing');
        temporaryGridContentEditing.forEach((temporaryContent) => {
            const temporaryButton = temporaryContent.querySelector('.js-grid-btn.js-temporary');
            const button = temporaryContent.querySelector('.js-grid-btn:not(.js-temporary)');
            temporaryContent.parentElement.classList.remove('editing-name');
            temporaryContent.classList.remove('editing');
            temporaryButton.classList.add('disabled');
            temporaryButton.disabled = true;
            temporaryButton.blur();

            temporaryButton.removeEventListener('keydown', DrAeScriptBox.saveButtonNameOnEnterEvent);
            temporaryButton.removeEventListener('blur', DrAeScriptBox.saveButtonNames);

            const userNewButtonName = temporaryButton.value;
            button.innerHTML = userNewButtonName;

            let config = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG));
            if (config.scripts[temporaryContent.parentElement.getAttribute('data-script-key')] !== undefined && config.scripts[temporaryContent.parentElement.getAttribute('data-script-key')].buttonName !== userNewButtonName) {
                config.scripts[temporaryContent.parentElement.getAttribute('data-script-key')].buttonName = userNewButtonName;

                DrAeScriptBox.saveConfigSettings(config);
                DrAeScriptBox.displayFeedback('Button name changed!');
            } else {
                DrAeScriptBox.displayFeedback('Cancelled button name change');
            }
        });
    }
}


