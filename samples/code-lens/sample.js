var editor = ace.edit("editor");
var codeLens = require("ace/ext/code_lens");
editor.session.setMode("ace/mode/html");

var commandId = "describeCodeLens";
editor.commands.addCommand({
    name: commandId,
    exec: function (editor, args) {
        // services available in `ctx`
        alert('CodeLens command called with arguments ' + args);
    }
});
editor.commands.addCommand({
    name: "clearCodeLenses",
    exec: function (editor, args) {
        editor.setOption("enableCodeLens", false);
        codeLens.clear(editor.session);
    }
});
editor.setOption("enableCodeLens", true);

codeLens.registerCodeLensProvider(editor, {
    provideCodeLenses: function (session, callback) {
        var p = [
            {
                start: {row: 0},
                command: {
                    id: "clearCodeLenses",
                    title: "Clear all code lenses",
                    arguments: []
                }
            }
        ];
        var l = session.getLength();

        for (var row = 2; row < l; row++) {
            var line = session.getLine(row);
            var endColumn = line.length;

            var m = /[{>]\s*$/.exec(line);
            if (!m) continue;

            p.push({
                start: {
                    row: row,
                    column: m.index
                },
                command: {
                    id: commandId,
                    title: "Line " + (row + 1),
                    arguments: ["line", row]
                }
            });

            if (m.index < 10) continue;
            p.push({
                start: {
                    row: row,
                    column: m.index
                },
                end: {
                    row: row,
                    column: m.index + 1
                },
                command: {
                    id: commandId,
                    title: "column " + endColumn,
                    arguments: ["column", endColumn]
                }
            });

            if (m.index < 30) continue;
            p.push({
                start: {
                    row: row,
                    column: m.index
                },
                command: {
                    id: commandId,
                    title: "Third Link",
                    arguments: ["3", row]
                }
            });

        }
        callback(null, p);
    }
});

window.editor = editor;
window.codeLens = codeLens;