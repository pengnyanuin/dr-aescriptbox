const csInterface = new CSInterface();

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
    config = JSON.parse(readConfigFileResult.data);
} else {
    alert("Error reading config file.");
    throw new Error('Error reading config file.');
}

const configOpenButton = document.getElementsByClassName('js-open-config')[0];
const configCloseButton = document.getElementsByClassName('js-close-config')[0];
configOpenButton.addEventListener('click', () => {
    const configWrap = document.getElementsByClassName('js-config')[0];
    configWrap.classList.add('open');
});
configCloseButton.addEventListener('click', () => {
    const configWrap = document.getElementsByClassName('js-config')[0];
    configWrap.classList.remove('open');
});

extensionSetup();
async function extensionSetup() {
    try {
        const buttonWrap = document.getElementsByClassName('js-buttons-wrap')[0];
        buttonWrap.innerHTML = '';

        let workingScripts = [];
        const scriptsFolder = await evalScriptAsync('getScriptsFolder()');
        const configScripts = config.scripts;

        for (const script of configScripts) {
            const scriptPath = scriptsFolder + script;
            const fileExistsResult = await evalScriptAsync('checkIfFileExists("' + escapeString(scriptPath) + '")');
            const fileExists = fileExistsResult === '1';

            if (fileExists) {
                workingScripts.push({
                    'scriptPath': escapeString(scriptPath),
                    'buttonName': script.replace(/\.jsx$/, ''),
                })
            }
        }

        document.getElementById('debug').innerText = JSON.stringify(workingScripts);

        for (const script of workingScripts) {
            const button = document.createElement('button');
            button.textContent = script.buttonName;
            button.id = script.buttonName;

            button.addEventListener('click', () => {
                csInterface.evalScript('runScript("' + script.scriptPath + '")', (result) => {
                    document.getElementById('debug').innerText = 'DONE';
                });
            });

            buttonWrap.appendChild(button);
        }

    } catch (error) {
        alert(error);
    }
}

function escapeString(string) {
    return string.replace(/\\/g, '\\\\');
}

function evalScriptAsync(script) {
    return new Promise((resolve, reject) => {
        csInterface.evalScript(script, (result) => {
            if (result === 'EvalScript error.') {
                reject(new Error('ExtendScript evalScript error'));
            } else {
                resolve(result);
            }
        });
    });
}

