const csInterface = new CSInterface();

window.onload = () => {
    DrAeToolkit.init();
};

const DrAeToolkit = {
    CONFIG_LOADED: false,
    CONFIG: null,

    init: function () {
        // Test button
        const testButton = document.querySelector("#test-button");
        testButton.addEventListener('click', () => {
            csInterface.evalScript('testScript()', (result) => {
                document.getElementById('debug').innerText = 'result';
            });
        });

        // Get config data
        let config = null;
        const extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);
        const configPath = extensionRoot + "/config.json";
        const readConfigFileResult = window.cep.fs.readFile(configPath);
        if (readConfigFileResult.err === 0) {
            DrAeToolkit.CONFIG = JSON.parse(readConfigFileResult.data);
        } else {
            alert("Error reading config file.");
            throw new Error('Error reading config file.');
        }

        const configOpenButton = document.getElementsByClassName('js-open-config')[0];
        const configCloseButton = document.getElementsByClassName('js-close-config')[0];
        configOpenButton.addEventListener('click', DrAeToolkit.openConfig);
        configCloseButton.addEventListener('click', DrAeToolkit.closeConfig);

        DrAeToolkit.extensionSetup()
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
                    })
                }
            }

            // document.getElementById('debug').innerText = JSON.stringify(workingScripts);

            for (const script of workingScripts) {
                const button = document.createElement('button');
                button.textContent = script.buttonName;
                button.id = script.buttonName;

                button.addEventListener('click', () => {
                    csInterface.evalScript('draetk_runScript("' + script.scriptPath + '")', (result) => {
                        // document.getElementById('debug').innerText = 'DONE';
                        DrAeToolkit.displayFeedback('DONE')
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
        const scriptsFiles = JSON.parse(scriptsFilesResult);

        for (const script of scriptsFiles) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            const textWrap = document.createElement('span');
            const checkboxWrap = document.createElement('span');
            checkbox.type = 'checkbox';
            textWrap.innerText = 'This is label of ' + script;
            checkboxWrap.classList.add('checkbox-wrap')

            configContent.appendChild(label);
            label.appendChild(checkboxWrap);
            label.appendChild(textWrap);
            checkboxWrap.appendChild(checkbox);
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

    displayFeedback: function(string) {

    }
}


