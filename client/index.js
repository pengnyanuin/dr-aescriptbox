/* 1) Create an instance of CSInterface. */
const csInterface = new CSInterface();

/* 2) Make a reference to your HTML button and add a click handler. */
const openButton = document.querySelector("#open-button");
openButton.addEventListener('click', openDoc);

const testButton = document.querySelector("#test-button");
testButton.addEventListener('click', testDoc);

const maskColorButton = document.querySelector("#script-mask-color");
maskColorButton.addEventListener('click', maskColor);

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
function openDoc() {
    csInterface.evalScript('listScripts()', (result) => {
        const jsonResult = JSON.parse(result);
        document.getElementById('debug').innerText = result;
    });
}

function testDoc() {
    csInterface.evalScript('runTest()', (result) => {
        document.getElementById('debug').innerText = 'DONE';
    });
}

function maskColor() {
    csInterface.evalScript('maskColorScript()', (result) => {
        const jsonResult = JSON.parse(result);
        document.getElementById('debug').innerText = jsonResult;
    });
}
