import {Ace, AceEditor, AceLayout, Box, CommandManager, EditorType, MenuToolbar, TabManager} from "ace-layout";
import {addMenu} from "./menu";
import {pathToTitle, request} from "./utils";
import {generateTemplate, useCustomUserCode} from "./template";
import * as defaultLayout from "./layouts/two-columns-bottom.json";
import {Tab} from "ace-layout/widgets/tabs/tab";
import {SAMPLES} from "./samples";
import {registerLanguageProvider} from "./linters/linters";
import {displayError, windowError} from "./error_handler";

let editorBox: Box, exampleBox: Box, consoleBox: Box;
let currentPath: string | undefined;
let serializedTabData = "";
let previewTab: Tab | undefined;

document.body.innerHTML = "";
let base = new Box({
    toolBars: {
        top: new MenuToolbar(),
    },
    vertical: false,
    0: new Box({
        0: editorBox = new Box({isMain: true}),
        1: new Box({
            vertical: true,
            0: exampleBox = new Box({isMain: true}),
            1: consoleBox = new Box({
                size: 100,
                isMain: true,
            }),
        })
    }),
});

new AceLayout(base);
addMenu(setSample);

base.render();
document.body.appendChild(base.element);
registerLanguageProvider(editorBox);

function onResize() {
    base.setBox(0, 0, window.innerWidth, window.innerHeight);
}

let tabManager = TabManager.getInstance({
    containers: {
        main: editorBox,
        example: exampleBox,
        console: consoleBox,
    }
});
let tabState = localStorage.playground_tabs ? JSON.parse(localStorage.playground_tabs) : {"main": defaultLayout};
tabManager.setState(tabState);

onResize();

let allSamples = Object.values(SAMPLES).reduce((prev, curr) => prev.concat(curr.map(path => path.toLowerCase())), []);

let tabCSS: Tab<Ace.EditSession>, tabHTML: Tab<Ace.EditSession>, tabMD: Tab<Ace.EditSession>;

function getTab(title: string, path: string): Tab<Ace.EditSession> {
    let tab = tabManager.open<Ace.EditSession>({title: title, path: path}, "main");
    onSessionValueChange(tab.session);
    return tab;
}

export function initTabs() {
    tabCSS = getTab("CSS", "sample.css");
    tabHTML = getTab("HTML", "sample.html");
    tabMD = getTab("Markdown", "guide.md");
}

let hashSample;
let sampleValues: [string, string, string] | undefined;

function loadHashSample() {
    hashSample = new URL(document.URL).hash.replace("#", "");
    let path = 'samples/' + (allSamples.includes(hashSample) ? hashSample : "dod");
    let value = new URL(document.URL).searchParams.get("value");
    if (value) {
        try {
            let data = window.atob(value).split("\\0");
            if (data.length == 3)
                sampleValues = data as [string, string, string];
        } catch (e) {
        }
    } else {
        let state = new URL(document.URL).searchParams.get("state");
        if (state) {
            try {
                localStorage[path] = window.atob(state);
            } catch (e) {
            }
        }
    }

    setSample(path);
}

function createEditorButton(textContent: string, title: string, onclick: () => void) {
    let button = document.createElement("button");
    button.textContent = textContent;
    button.style.marginLeft = "auto";
    button.style.marginRight = "5px";
    button.setAttribute('title', title);
    button.onclick = onclick;
    editorBox.addButton(button);
}

function createRollbackButton() {
    createEditorButton("Сбросить", 'Сбросить до значения по умолчанию', function () {
        localStorage[currentPath!] = null;
        initTabs();
        loadSample(currentPath!);
    });
}

function createRunButton() {
    createEditorButton("Запустить", "Ctrl+Enter", runSample);
}

function serializeTabsData() {
    return [tabMD, tabCSS, tabHTML].map(tab => tab.session.getValue()).join("\\0");
}

function createCopyLinkButton() {
    createEditorButton("Скопировать ссылку", "Скопировать ссылку", function () {
        let url = new URL(document.URL);nn
        url.searchParams.set("value", window.btoa(serializeTabsData()));
        navigator.clipboard.writeText(url.toString()).then(r => {
        });
    });
}


function createImagesLinkButton() {
    createEditorButton("Картинки", "Посмотреть картинки", function () {
        window.location.href = "./sigal";
    });
}

function createCloseConsoleButton() {
    consoleBox.renderButtons([{
        class: "consoleCloseBtn",
        title: "F6",
        onclick: function () {
            consoleBox.hide();
        },
        content: "x"
    }]);
}

export function createButtons() {
    createRollbackButton();
    createCopyLinkButton();
    createImagesLinkButton();
    createRunButton();
    createCloseConsoleButton();
}

export function runSample() {
    window.onmessage ??= windowError;
    let html = generateTemplate(tabMD.session.getValue(), tabHTML.session.getValue(), tabCSS.session.getValue())
    previewTab = tabManager.open({
        title: "Результат",
        editorType: EditorType.preview,
        path: "result"
    }, "example");
    displayError("");
    previewTab.editor!.setSession(previewTab, html);
    serializedTabData = serializeTabsData();
    tabDataIsRun();
}

CommandManager.registerCommands([{
    bindKey: {
        win: "Ctrl-Enter",
        mac: "Command-Enter"
    },
    exec: runSample
}]);

createButtons();

function setSample(path: string) {
    saveSample();

    let hash = path.split("/").pop()!;
    if (hash != hashSample) {
        let url = new URL(document.URL);
        url.hash = hash;
        url.searchParams.delete("value");
        url.searchParams.delete("state");
        document.location.href = url.href;
    }

    initTabs();

    if (sampleValues) {
        setTabValues(sampleValues);
        sampleValues = undefined;
    } else if (localStorage[path]) {
        restoreSample(path);
    } else {
        loadSample(path);
    }

    currentPath = path;
}

function restoreSample(path) {
    let storage = JSON.parse(localStorage[path]);
    if (!storage) {
        loadSample(path);
        return;
    }
    if (storage["@file@sample.html"]) {
        var html = JSON.parse(storage["@file@sample.html"]);
        html.value = addMissingAceScript(html.value);
        storage["@file@sample.html"] = JSON.stringify(html);
    }
    tabManager.restoreFrom(storage);
    runSample();
}

function saveSample() {
    if (!currentPath)
        return;

    let storage = getTabData();
    localStorage[currentPath] = JSON.stringify(storage);
}

export function getTabData() {
    let storage = {};

    function saveTabData(tab: Tab<Ace.EditSession>) {
        storage["@file@" + tab.path] = AceEditor.getSessionState(tab);
    }

    saveTabData(tabMD);
    saveTabData(tabCSS);
    saveTabData(tabHTML);
    return storage;
}

function setTabValues(samples: [string, string, string]) {
    tabMD.session.setValue(samples[0]);
    tabCSS.session.setValue(samples[1]);
    tabHTML.session.setValue(addMissingAceScript(samples[2]));

    runSample();
}

function loadSample(path: string) {
    let md = request(path + '/guide.md').then(function (response: XMLHttpRequest) {
        return `//${pathToTitle(path)}\n\n` + response.responseText;
    });
    let css = request(path + '/sample.css').then(function (response: XMLHttpRequest) {
        return response.responseText;
    });
    let html = request(path + '/sample.html').then(function (response: XMLHttpRequest) {
        return response.responseText;
    });

    Promise.all([md, css, html]).then(
        function (samples) {
            setTabValues(samples);
        },
        function (err) {
            displayError("");
        }
    );
}

/**
 * Add ace script to html if it is not present, and replace cdnjs url to unpkg. Returns non-changed html if it
 * contains custom user code with html or doctype.
 * 
 * @param html
 */
function addMissingAceScript(html: string) {
    if (useCustomUserCode(html)) {
        return html;
    }
    if (!/script\s+src=["'](.+ace\.js)['"]/.test(html)) {
        html = '<script src="https://www.unpkg.com/ace-builds@latest/src-noconflict/ace.js"></script>\n' + html;
    }
    html = html.replaceAll(/cdnjs\.cloudflare\.com\/ajax\/libs\/ace\/[\d.]+\/([\w-]+)(?:\.min)?/g, "www.unpkg.com/ace-builds@latest/src-noconflict/$1");
    return html;
}

function tabDataIsChanged() {
    previewTab!.setTitle("Результат*");
    previewTab!.element.style.fontStyle = "italic";
}

function tabDataIsRun() {
    previewTab!.setTitle("Результат");
    previewTab!.element.style.fontStyle = "";
}

function onSessionValueChange(session: Ace.EditSession) {
    session.on("change", () => {
        if (!previewTab)
            return;
        let newTabData = serializeTabsData();
        if (newTabData != serializedTabData) {
            tabDataIsChanged();
        } else {
            tabDataIsRun();
        }
    })
}

window.onpopstate = loadHashSample;
window.onload = loadHashSample;
window.onresize = onResize;
window.onbeforeunload = function () {
    localStorage.playground_tabs = JSON.stringify(tabManager.toJSON());
    saveSample();
}
