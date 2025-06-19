function draesb_getScriptsFolder() {
    return Folder.appPackage.fsName + "/Scripts/";
}

function draesb_getUserScriptsFolder() {
    var aeVersion = app.version.split(" ")[0];
    var majorVersion = aeVersion.split(".")[0];
    var userScriptsPath;

    if ($.os.indexOf("Windows") !== -1) {
        userScriptsPath = Folder.userData.fsName + "/Adobe/After Effects/" + majorVersion + ".0/Scripts/";
    } else {
        var homeFolder = Folder("~");
        userScriptsPath = homeFolder.fsName + "/Library/Preferences/Adobe/After Effects/" + majorVersion + ".0/Scripts/";
    }

    return userScriptsPath;
}

function draesb_getScriptsFromFolderPath(scriptsFolderPath) {
    var resultScripts = [];

    function shouldSkipFolder(folderName) {
        if (
            folderName === 'Startup' ||
            folderName === 'Shutdown' ||
            decodeURI(folderName) === 'ScriptUI Panels'
        ) {
            return true;
        }

        if (folderName.match(/^\(.*\)$/)) {
            return true;
        }

        return false;
    }

    function scanFolder(folder, relativePath) {
        if (!folder || !folder.exists) {
            return;
        }

        if (!(folder instanceof Folder)) {
            return;
        }

        if (shouldSkipFolder(folder.name)) {
            return;
        }

        var filesAndFolders;
        try {
            filesAndFolders = folder.getFiles();
        } catch (e) {
            return;
        }

        for (var i = 0; i < filesAndFolders.length; i++) {
            var checkedFile = filesAndFolders[i];
            if (checkedFile instanceof Folder) {
                var subRelativePath = relativePath + decodeURI(checkedFile.name) + '/';
                scanFolder(checkedFile, subRelativePath);
            } else if (checkedFile instanceof File) {
                var lowerName = checkedFile.name.toLowerCase();
                if (lowerName.match(/\.(jsx|jsxbin)$/)) {
                    resultScripts.push({
                        scriptName: relativePath + checkedFile.name,
                        scriptPath: checkedFile.fsName
                    });
                }
            }
        }
    }

    var rootFolder = new Folder(scriptsFolderPath);
    if (!rootFolder.exists) {
        alert('Folder does not exist: ' + scriptsFolderPath);
        return '';
    }

    scanFolder(rootFolder, '');
    return resultScripts;
}

function draesb_getAllScriptsContent() {
    var scriptsFolderPath = draesb_getScriptsFolder();
    var scriptsUserFolderPath = draesb_getUserScriptsFolder();

    const systemScripts = draesb_getScriptsFromFolderPath(scriptsFolderPath);
    const userScripts = draesb_getScriptsFromFolderPath(scriptsUserFolderPath);

    return JSON.stringify({
        'systemScripts': systemScripts,
        'userScripts': userScripts,
    });
}

function draesb_checkIfFileExists(filePath) {
    var file = new File(filePath);

    if (file.exists) {
        return '1';
    } else {
        return '0'
    }
}

function draesb_runScript(scriptPath) {
    $.evalFile(scriptPath);
}

// JSON stringify and parse methods
"object"!=typeof JSON&&(JSON={}),function(){"use strict";var gap,indent,meta,rep,rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,rx_escapable=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function f(t){return t<10?"0"+t:t}function this_value(){return this.valueOf()}function quote(t){return rx_escapable.lastIndex=0,rx_escapable.test(t)?'"'+t.replace(rx_escapable,function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}function str(t,e){var n,o,f,u,r,$=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";if(gap+=indent,r=[],"[object Array]"===Object.prototype.toString.apply(i)){for(n=0,u=i.length;n<u;n+=1)r[n]=str(n,i)||"null";return f=0===r.length?"[]":gap?"[\n"+gap+r.join(",\n"+gap)+"\n"+$+"]":"["+r.join(",")+"]",gap=$,f}if(rep&&"object"==typeof rep)for(n=0,u=rep.length;n<u;n+=1)"string"==typeof rep[n]&&(f=str(o=rep[n],i))&&r.push(quote(o)+(gap?": ":":")+f);else for(o in i)Object.prototype.hasOwnProperty.call(i,o)&&(f=str(o,i))&&r.push(quote(o)+(gap?": ":":")+f);return f=0===r.length?"{}":gap?"{\n"+gap+r.join(",\n"+gap)+"\n"+$+"}":"{"+r.join(",")+"}",gap=$,f}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=this_value,Number.prototype.toJSON=this_value,String.prototype.toJSON=this_value),"function"!=typeof JSON.stringify&&(meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(t,e,n){var o;if(gap="",indent="","number"==typeof n)for(o=0;o<n;o+=1)indent+=" ";else"string"==typeof n&&(indent=n);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){var j;function walk(t,e){var n,o,f=t[e];if(f&&"object"==typeof f)for(n in f)Object.prototype.hasOwnProperty.call(f,n)&&(void 0!==(o=walk(f,n))?f[n]=o:delete f[n]);return reviver.call(t,e,f)}if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw SyntaxError("JSON.parse")})}();