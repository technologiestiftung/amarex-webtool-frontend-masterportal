const replace = require("replace-in-file"),
    path = require("path"),
    rootPath = path.resolve(__dirname, "../../"),
    mastercodeVersionFolderName = require(path.resolve(rootPath, "devtools/tasks/getMastercodeVersionFolderName"))();


module.exports = function (destination) {
    const replacements = [
        {
            "files": destination + "/index.html",
            "from": /\/*(\.+\/)*src_3_0_0\/assets\/img\/Logo_Masterportal\.svg/g,
            "to": "../mastercode/" + mastercodeVersionFolderName + "/img/Logo_Masterportal.svg"
        },
        {
            "files": destination + "/js/masterportal.js",
            "from": /\/img\/tools\/draw\/circle_/g,
            "to": "/mastercode/" + mastercodeVersionFolderName + "/img/tools/draw/circle_"
        },
        {
            "files": destination + "/index.html",
            "from": /\/*(\.+\/)*build/g,
            "to": "../mastercode/" + mastercodeVersionFolderName
        },
        {
            "files": destination + "/css/masterportal.css",
            "from": /css\/woffs/g,
            "to": "./woffs"
        },
        {
            "files": destination + "/css/masterportal.css",
            "from": /url\s?\(\s?"\/img\//g,
            "to": "url(\"../img/"
        },
        {
            "files": destination + "/css/masterportal.css",
            "from": /url\s?\(\s?'\/img\//g,
            "to": "url('../img/"
        },
        {
            "files": destination + "/css/masterportal.css",
            "from": /url\s?\(\s?\/img\//g,
            "to": "url(../img/"
        },
        {
            "files": destination + "/js/masterportal.js",
            "from": /\..\/..\/img\//g,
            "to": "../mastercode/" + mastercodeVersionFolderName + "/img/"
        },
        {
            "files": destination + "/js/masterportal.js",
            "from": /\..\/..\/src_3_0_0\/assets\/img\//g,
            "to": "../mastercode/" + mastercodeVersionFolderName + "/img/"
        },
        {
            "files": destination + "/js/masterportal.js",
            "from": /\/locales_3_0_0\/\{\{lng\}\}\/\{\{ns\}\}\.json/g,
            "to": "./../mastercode/" + mastercodeVersionFolderName + "/locales/{{lng}}/{{ns}}.json"
        }
    ];

    replacements.forEach(function (replacement) {
        replace.sync({
            files: replacement.files,
            from: replacement.from,
            to: replacement.to
        });
    });
};
