const csInterface = new CSInterface();

window.onload = () => {
    DrAeScriptBox.init();
};

const DrAeScriptBox = {
    VERSION: '1.1.3',
    CONFIG_FILE_PATH: null,
    CONFIG_FILE_FOLDER_PATH: null,
    CONFIG: null,
    CONFIG_SETUP_MISSING_SCRIPTS: {},
    GRID_STACK_INSTANCE: null,
    GRID_BTN_COLORS: {
        red: {
            color: '#ff0000',
            title: 'Red',
        },
        green: {
            color: '#00ff00',
            title: 'Green',
        },
        blue: {
            color: '#0000ff',
            title: 'Blue',
        }
    },

    init: function () {
        // Get config data
        let config = null;
        const userDataPath = csInterface.getSystemPath(SystemPath.USER_DATA);
        DrAeScriptBox.CONFIG_FILE_FOLDER_PATH = userDataPath + '/DrAeScriptBox';
        DrAeScriptBox.CONFIG_FILE_PATH = DrAeScriptBox.CONFIG_FILE_FOLDER_PATH + '/config.json';
        const readConfigFileResult = window.cep.fs.readFile(DrAeScriptBox.CONFIG_FILE_PATH);
        if (readConfigFileResult.err === 0) {
            DrAeScriptBox.CONFIG = JSON.parse(readConfigFileResult.data);
        } else {
            // File not found, create default object
            DrAeScriptBox.CONFIG = {
                'ver': DrAeScriptBox.VERSION,
                'options': {
                    'columns': 2,
                    'cellWidth': null,
                    'cellHeight': 30
                },
                'scripts': {}
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
        DrAeScriptBox.displayFeedback('Welcome!')
    },

    extensionSetup: async function() {
        try {
            const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
            buttonWrap.classList.remove('empty');
            DrAeScriptBox.cleanGridStack();

            let workingScripts = [];
            const configScripts = DrAeScriptBox.CONFIG.scripts;

            for (const scriptKey in configScripts) {
                const script = configScripts[scriptKey];
                const fileExistsResult = await DrAeScriptBox.evalScriptAsync('draesb_checkIfFileExists("' + DrAeScriptBox.escapeString(script.path) + '")');
                const fileExists = fileExistsResult === '1';

                if (fileExists) {
                    workingScripts.push({
                        scriptPath: DrAeScriptBox.escapeString(script.path),
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
                    DrAeScriptBox.displayFeedback('Run ' + script.scriptName)
                    csInterface.evalScript('draesb_runScript("' + script.scriptPath + '")', (result) => {
                        DrAeScriptBox.displayFeedback('Finished ' + script.scriptName)
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
        const scriptsFilesResult = await DrAeScriptBox.evalScriptAsync('draesb_getAllScriptsContent()');

        if (scriptsFilesResult === '') {
            return;
        }

        configContent.innerHTML = '';

        const scriptsFiles = JSON.parse(scriptsFilesResult);
        const systemScripts = scriptsFiles.systemScripts;
        const userScripts = scriptsFiles.userScripts;

        DrAeScriptBox.CONFIG_SETUP_MISSING_SCRIPTS = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG.scripts));
        const newSystemScriptElements = DrAeScriptBox.configSetupBuildScriptElements(systemScripts);
        const newUserScriptElements = DrAeScriptBox.configSetupBuildScriptElements(userScripts);

        let sectionCounter = 0;
        let systemScriptsWrap, systemScriptsTitle, userScriptsWrap, usersScriptsTitle;

        if (newSystemScriptElements.length > 0) {
            systemScriptsWrap = document.createElement('div');
            systemScriptsTitle = document.createElement('button');
            systemScriptsTitle.classList.add('js-config-system-section-title');
            systemScriptsWrap.classList.add('config__content__section__part');
            systemScriptsTitle.classList.add('config__content__section__part__title');
            systemScriptsTitle.innerHTML = 'System scripts';

            for (const newSystemScript of newSystemScriptElements) {
                systemScriptsWrap.appendChild(newSystemScript);
            }

            systemScriptsTitle.addEventListener('click', () => {
                if (systemScriptsTitle.classList.contains('collapsed')) {
                    systemScriptsTitle.classList.remove('collapsed');
                    systemScriptsWrap.classList.remove('hidden');
                } else {
                    systemScriptsTitle.classList.add('collapsed');
                    systemScriptsWrap.classList.add('hidden');
                }

                DrAeScriptBox.saveConfigCollapsibleOptions();
            })

            sectionCounter++;
        }

        if (newUserScriptElements.length > 0) {
            userScriptsWrap = document.createElement('div');
            usersScriptsTitle = document.createElement('button');
            usersScriptsTitle.classList.add('js-config-user-section-title');
            userScriptsWrap.classList.add('config__content__section__part');
            usersScriptsTitle.classList.add('config__content__section__part__title');
            usersScriptsTitle.innerHTML = 'User scripts';

            for (const newUserScript of newUserScriptElements) {
                userScriptsWrap.appendChild(newUserScript);
            }

            usersScriptsTitle.addEventListener('click', () => {
                if (usersScriptsTitle.classList.contains('collapsed')) {
                    usersScriptsTitle.classList.remove('collapsed');
                    userScriptsWrap.classList.remove('hidden');
                } else {
                    usersScriptsTitle.classList.add('collapsed');
                    userScriptsWrap.classList.add('hidden');
                }

                DrAeScriptBox.saveConfigCollapsibleOptions();
            })

            sectionCounter++;
        }

        if (sectionCounter > 1) {
            if (systemScriptsTitle) {
                configContent.appendChild(systemScriptsTitle);
            }

            systemScriptsWrap.classList.add('sectioned')

            if (DrAeScriptBox.CONFIG.options.systemScriptsCollapsed) {
                systemScriptsTitle.classList.add('collapsed');
                systemScriptsWrap.classList.add('hidden');
            }
        }

        if (systemScriptsWrap) {
            configContent.appendChild(systemScriptsWrap);
        }

        if (sectionCounter > 1) {
            if (usersScriptsTitle) {
                configContent.appendChild(usersScriptsTitle);
            }

            userScriptsWrap.classList.add('sectioned')

            if (DrAeScriptBox.CONFIG.options.userScriptsCollapsed) {
                usersScriptsTitle.classList.add('collapsed');
                userScriptsWrap.classList.add('hidden');
            }
        }

        if (userScriptsWrap) {
            configContent.appendChild(userScriptsWrap);
        }

        for (const option of configOptions) {
            option.value = DrAeScriptBox.CONFIG.options[option.name]
        }

        // Missing scripts
        if (Object.keys(DrAeScriptBox.CONFIG_SETUP_MISSING_SCRIPTS).length !== 0) {
            for(const missingScriptKey in DrAeScriptBox.CONFIG_SETUP_MISSING_SCRIPTS) {
                const missingScriptPath = DrAeScriptBox.CONFIG_SETUP_MISSING_SCRIPTS[missingScriptKey].path;

                const missingScriptWrap = document.createElement('div');
                const missingScriptButton = document.createElement('button');
                const missingScriptText = document.createElement('span');
                const missingScriptButtonIcon = document.createElement('img');

                missingScriptButtonIcon.src = './icons/minus.svg';
                missingScriptButtonIcon.alt = 'Remove'
                missingScriptWrap.classList.add('label');
                missingScriptWrap.classList.add('missing-script');
                missingScriptWrap.classList.add('js-missing-script');
                missingScriptText.classList.add('text-wrap');
                missingScriptButton.classList.add('config-btn');
                missingScriptText.innerHTML = missingScriptPath;
                missingScriptButton.title = 'Remove script';
                missingScriptWrap.setAttribute('data-script-name', missingScriptKey);

                missingScriptButton.addEventListener('click', () => {
                    missingScriptWrap.remove();
                });

                missingScriptButton.appendChild(missingScriptButtonIcon);
                missingScriptWrap.appendChild(missingScriptButton);
                missingScriptWrap.appendChild(missingScriptText);

                configContent.appendChild(missingScriptWrap);
            }
        }
    },

    configSetupBuildScriptElements: function (scripts) {
        const configScripts = DrAeScriptBox.CONFIG.scripts;
        let newScriptElements = [];

        for (const script of scripts) {
            let customNameWrapper = null;
            if (Object.hasOwn(configScripts, script.scriptName) && configScripts[script.scriptName].buttonName !== DrAeScriptBox.getDefaultButtonNameFromScriptName(script.scriptName)) {
                customNameWrapper = document.createElement('span');
                customNameWrapper.classList.add('config__content__custom-name')
                if (configScripts[script.scriptName].buttonName === '') {
                    customNameWrapper.innerHTML = ' (empty)';
                } else {
                    customNameWrapper.innerHTML = ' (' + configScripts[script.scriptName].buttonName + ')';
                }
            }

            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const textWrap = document.createElement('span');
            const checkboxWrap = document.createElement('span');
            checkbox.type = 'checkbox';
            checkbox.name = script.scriptName;
            checkbox.setAttribute('data-script-path', script.scriptPath);
            checkboxWrap.classList.add('checkbox-wrap');
            textWrap.classList.add('text-wrap');

            const scriptNameWrap = DrAeScriptBox.getSplitScriptName(script.scriptName);

            textWrap.appendChild(scriptNameWrap);
            if (customNameWrapper) {
                textWrap.appendChild(customNameWrapper);
            }
            label.appendChild(checkboxWrap);
            label.appendChild(textWrap);
            checkboxWrap.appendChild(checkbox);

            if (Object.values(configScripts).some(s => s.name === script.scriptName) || Object.values(configScripts).some(s => s.name === decodeURIComponent(script.scriptName))) {
                checkbox.checked = true;

                delete DrAeScriptBox.CONFIG_SETUP_MISSING_SCRIPTS[script.scriptName];
            }

            newScriptElements.push(label);
        }

        return newScriptElements;
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
        DrAeScriptBox.configSetup().then(() => {
            // After config loaded
        });
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
                    buttonName: DrAeScriptBox.getDefaultButtonNameFromScriptName(selectedScript.name),
                    path: decodeURIComponent(selectedScript.getAttribute('data-script-path')),
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

        // Save missing scripts
        const missingScriptsList = configContent.querySelectorAll('.js-missing-script');
        missingScriptsList.forEach(missingScript => {
            const missingScriptName = missingScript.getAttribute('data-script-name');

            if (DrAeScriptBox.CONFIG.scripts[missingScriptName]) {
                config.scripts[missingScriptName] = DrAeScriptBox.CONFIG.scripts[missingScriptName];
            }
        })

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

        // apply current version
        config.ver = DrAeScriptBox.VERSION;

        if (!DrAeScriptBox.saveConfigSettings(config)) {
            return;
        }

        DrAeScriptBox.extensionSetup();
        DrAeScriptBox.displayFeedback('Config saved!')
    },

    saveConfigCollapsibleOptions: function () {
        let config = JSON.parse(JSON.stringify(DrAeScriptBox.CONFIG));
        const configContent = document.getElementsByClassName('js-config-content')[0];
        const systemScriptsSectionTitle = configContent.querySelector('.js-config-system-section-title');
        const userScriptsSectionTitle = configContent.querySelector('.js-config-user-section-title');
        config.options.systemScriptsCollapsed = systemScriptsSectionTitle && systemScriptsSectionTitle.classList.contains('collapsed');
        config.options.userScriptsCollapsed = userScriptsSectionTitle && userScriptsSectionTitle.classList.contains('collapsed');

        DrAeScriptBox.saveConfigSettings(config);
    },

    saveConfigSettings: function(config) {
        if (!DrAeScriptBox.ensureFolder(DrAeScriptBox.CONFIG_FILE_FOLDER_PATH)) {
            alert('Could not create config folder.');
            return false;
        }

        const result = window.cep.fs.writeFile(DrAeScriptBox.CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        if (result.err !== 0) {
            alert('Error saving the config file.');
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

            // Color buttons
            const gridColorsWrap = document.createElement('div');
            gridColorsWrap.classList.add('grid-colors-wrap');
            button.parentNode.parentNode.appendChild(gridColorsWrap);

            for(const color in DrAeScriptBox.GRID_BTN_COLORS) {
                const colorElement = document.createElement('button');
                colorElement.classList.add('js-grid-color-btn');
                colorElement.classList.add('config-btn');
                colorElement.classList.add('color-btn');
                colorElement.style.backgroundColor = DrAeScriptBox.GRID_BTN_COLORS[color].color;
                colorElement.title = DrAeScriptBox.GRID_BTN_COLORS[color].title;

                colorElement.addEventListener('click', () => {
                    alert(color);
                });

                gridColorsWrap.appendChild(colorElement);
            }
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
        temporaryButton.addEventListener('blur', DrAeScriptBox.saveButtonNames); // todo needs to change in order for colors to work

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
    },

    getDefaultButtonNameFromScriptName: function (scriptName) {
        const decodedScriptName = decodeURIComponent(scriptName).replace(/\.jsx(bin)?$/i, '');

        const slashIndex = decodedScriptName.lastIndexOf('/');
        if (slashIndex === -1) {
            return decodedScriptName;
        }

        return decodedScriptName.substring(slashIndex + 1);
    },

    getSplitScriptName: function (scriptName) {
        const lastSlashIndex = scriptName.lastIndexOf('/');
        let scriptNamePart, scriptPathPart;
        if (lastSlashIndex === -1) {
            scriptNamePart = scriptName;
        } else {
            scriptPathPart = scriptName.substring(0, lastSlashIndex + 1);
            scriptNamePart = scriptName.substring(lastSlashIndex + 1);
        }

        const scriptNameWrap = document.createElement('span');
        const scriptNameNamePart = document.createElement('span');
        scriptNameNamePart.innerHTML = decodeURIComponent(scriptNamePart);
        if (scriptPathPart) {
            const scriptNamePathPart = document.createElement('span');
            scriptNamePathPart.classList.add('text-faded');
            scriptNamePathPart.innerHTML = decodeURIComponent(scriptPathPart);

            scriptNameWrap.appendChild(scriptNamePathPart);
        }

        scriptNameWrap.appendChild(scriptNameNamePart);

        return scriptNameWrap;
    }
}


