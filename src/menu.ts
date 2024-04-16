import {MenuManager, TabManager, CommandManager} from "ace-layout";
import {SAMPLES} from "./samples";
import {pathToTitle} from "./utils";
import {Layouts} from "./layouts/layouts";
import {createButtons, getTabData, initTabs, runSample} from "./playground";

export function addMenu(callback) {
    let menuManager = MenuManager.getInstance();
    let position = 0;
    let root = "Сценарии";
    menuManager.addByPath(root, {position: position});
    Object.keys(SAMPLES).forEach(function (i) {
        let items = SAMPLES[i];
        for (let name of items) {
            position++;
            let path = [root, name].join('/');
            menuManager.addByPath(pathToTitle(path), {
                position: position,
                exec: () => callback(path.toLowerCase())
            });
        }
        position++;
        menuManager.addByPath(root + '/~' + position, {position: position});
    });

    root = "Вид";
    menuManager.addByPath(root, {position: 50});

    let toggle = () => TabManager.getInstance().containers["console"].toggleShowHide();
    menuManager.addByPath(root + "/Развернуть консоль", {
        position: 0,
        exec: toggle,
        hotKey: "F6"
    });

    CommandManager.registerCommands([{
        bindKey: {
            win: "F6",
            mac: "F6"
        },
        exec: toggle
    }]);

    root = "Вид/Шаблон";
    menuManager.addByPath(root, {position: 100});
    position = 0;

    Object.keys(Layouts).forEach(function (i) {
        let changeLayout = () => {
            let storage = getTabData();
            let tabManager = TabManager.getInstance();
            tabManager.setState({"main": Layouts[i]});
            initTabs();
            tabManager.restoreFrom(storage);

            createButtons();
            runSample();
        };
        menuManager.addByPath(root + '/' + i, {position: position, exec: changeLayout});
        position++;
    });
root = "Картинки";
menuManager.addByPath(root, {
    position: 100,
    exec: () => {
        window.location.href = "./sigal";
    }
});
