/* eslint-disable no-console */
const fs = require("fs").promises,
    path = require("path"),
    createMainMenu = require("./createMainMenu"),
    createSecondaryMenu = require("./createSecondaryMenu"),
    {copyDir, replaceInFile, removeAttributesFromTools} = require("./utils"),
    {PORTALCONFIG, TOPICS, BASEMAPS, BASEMAPS_OLD, SUBJECTDATA} = require("./constants"),
    rootPath = path.resolve(__dirname, "../../../"),
    {deprecated, toolsNotToMigrate, toRemoveFromConfigJs, toRemoveFromTools} = require("./configuration"),
    migratedTools = toolsNotToMigrate.concat(deprecated);

/**
 * Migrates the mapView.
 * @param {Object} data content of v2 config.json
 * @returns {Object} the migrated mapView
 */
function readMapView (data) {
    console.info("mapView");
    return data[PORTALCONFIG].mapView;
}

/**
 * Migrates the controls.
 * @param {Object} data content of v2 config.json
 * @returns {Object} the migrated controls
 */
function migrateControls (data) {
    console.info("controls");
    const controls = data[PORTALCONFIG].controls;

    controls.expandable = {};
    console.info("--- HINT: fill controls into expandable, to expand and collapse controlbar.");
    console.info("--- HINT: use control 'startModule' to start tool by control-icon.");
    return controls;
}

/**
 * Migrates the gfi to getFeatureInfo.
 * @param {Object} data content of v2 config.json
 * @returns {Object} the migrated getFeatureInfo
 */
function migrateGFI (data) {
    const gfi = data[PORTALCONFIG].menu.tools?.children?.gfi || data[PORTALCONFIG].menu.gfi;
    let getFeatureInfo = null;

    if (gfi) {
        console.info("getFeatureInfo");
        getFeatureInfo = {...gfi};

        getFeatureInfo.type = "getFeatureInfo";
        removeAttributesFromTools(toRemoveFromTools, getFeatureInfo);
        migratedTools.push("gfi");
    }

    return getFeatureInfo;
}

/**
 * Migrates the tree.
 * @param {Object} data content of v2 config.json
 * @param {Object} configJS the javascript config.js content
 * @returns {Object} the migrated tree
 */
function migrateTree (data, configJS) {
    console.info("tree");
    const oldTree = data[PORTALCONFIG].tree,
        newTree = {};

    if (oldTree?.highlightedFeatures) {
        newTree.highlightedFeatures = oldTree.highlightedFeatures;
    }
    newTree.addLayerButton = true;
    newTree.layerPills = {};
    newTree.layerPills.active = true;

    if (data[PORTALCONFIG].treeType === "default") {
        if (configJS.tree) {
            newTree.layerIDsToIgnore = [...configJS.tree.layerIDsToIgnore];
            newTree.layerIDsToStyle = [...configJS.tree.layerIDsToStyle];
            newTree.metaIDsToMerge = [...configJS.tree.metaIDsToMerge];
            newTree.metaIDsToIgnore = [...configJS.tree.metaIDsToIgnore];
        }
        newTree.type = "auto";
        newTree.validLayerTypesAutoTree = [
            "WMS",
            "SENSORTHINGS",
            "TERRAIN3D",
            "TILESET3D",
            "OBLIQUE"
        ];
        newTree.categories = [
            {
                "key": "kategorie_opendata",
                "name": "common:modules.layerTree.categoryOpendata",
                "active": true
            },
            {
                "key": "kategorie_inspire",
                "name": "common:modules.layerTree.categoryInspire"
            },
            {
                "key": "kategorie_organisation",
                "name": "common:modules.layerTree.categoryOrganisation"
            }
        ];

    }

    return newTree;
}

/**
 * Migrates the footer.
 * @param {Object} configJS the javascript configJs content
 * @returns {Object} the migrated footer
 */
function migrateFooter (configJS) {
    let newFooter = {};

    if (configJS.footer) {
        console.info("portalFooter");
        newFooter = configJS.footer;

        if (typeof configJS.scaleLine === "boolean") {
            newFooter.scaleLine = configJS.scaleLine;
        }
        delete newFooter.showVersion;
    }
    return newFooter;
}

/**
 * Migrates the topics.
 * @param {Object} data content of v2 config.json's topics
 * @returns {Object} the migrated topics
 */
function migrateTopics (data) {
    console.info(TOPICS);
    const oldTopics = data[TOPICS],
        oldBaseMaps = oldTopics[BASEMAPS] || oldTopics[BASEMAPS_OLD],
        oldSubjectData = oldTopics[SUBJECTDATA],
        topics = {};

    topics[BASEMAPS] = migrateBaseMaps(oldBaseMaps);
    topics[SUBJECTDATA] = migrateSubjectData(oldSubjectData);
    return topics;
}

/**
 * Migrates the basemaps.
 * @param {Object} oldData content of v2 config.json's basemaps
 * @returns {Object} the migrated basemaps
 */
function migrateBaseMaps (oldData) {
    console.info("   " + BASEMAPS);
    const baseMaps = {
        elements: []
    };

    if (oldData.Layer) {
        baseMaps.elements = oldData.Layer;
    }

    return baseMaps;
}

/**
 * Migrates the subject data.
 * NOTICE migration of folder structure with 'Ordner' is not implemented!
 * @param {Object} oldData content of v2 config.json's subjectdata
 * @returns {Object} the migrated subject data
 */
function migrateSubjectData (oldData) {
    console.info("   " + SUBJECTDATA + "\n");
    const subjectData = {
        elements: []
    };

    if (oldData && JSON.stringify(oldData).includes("Ordner")) {
        console.warn("NOTICE --- migrating layers in folder strucure ist not implemented yet!");
    }
    else if (oldData?.Layer) {
        subjectData.elements = oldData.Layer;
    }
    return subjectData;
}

/**
 * Migrates the index.html and removes loader stuff.
 * @param {String} sourceFolder the spurce folder
 * @param {String} destFolder the destination folder
 * @param {Object} indexFile the index.html file
 * @returns {void}
 */
function migrateIndexHtml (sourceFolder, destFolder, indexFile) {
    fs.readFile(path.resolve(sourceFolder, indexFile), "utf8")
        .then(data => {
            const regex = /<div id="loader" [\s\S]*loaders.js"><\/script>/g,
                // removes <div id="loader"... and load of special_loaders.js from index.html - loader is no longer provided.
                result = data.replace(regex, "");

            fs.writeFile(path.resolve(destFolder, indexFile), result, "utf8");
        })
        .catch(err => {
            console.error("write index.html", err);
        });
}

/**
 * Checks config.js file for module.exports and adds it if not found.
 * @param {String} sourceFolder the spurce folder
 * @param {Object} configJsFile the config.js file
 * @returns {void}
 */
async function checkConfigJS (sourceFolder, configJsFile) {
    const configJsPath = path.resolve(sourceFolder, configJsFile);

    if (Object.keys(require(configJsPath)).length === 0) {
        const data = await fs.readFile(configJsPath, "utf8"),
            dataToWrite = data + "\n  if (typeof module !== \"undefined\") { module.exports = Config; }";

        await fs.writeFile(configJsPath, dataToWrite, "utf8");
    }
}

/**
 * Migrates config.json, config.js and index.html to version 3.0.0.
 * @param {String} sourcePath the source path of the portal
 * @param {String} destPath the destination path to store the portal
 * @returns {void}
 */
async function migrateFiles (sourcePath, destPath) {
    const
        sourceFolder = path.resolve(rootPath, sourcePath),
        destFolder = path.resolve(rootPath, destPath);

    fs.readdir(sourceFolder)
        .then(files => {
            let configJS = null;
            const configJsonFile = files.find(fileName => fileName === "config.json"),
                configJsFile = files.find(fileName => fileName === "config.js"),
                indexFile = files.find(fileName => fileName === "index.html"),
                configJsonSrcFile = path.resolve(sourceFolder, configJsonFile),
                configJsonDestFile = path.resolve(destFolder, configJsonFile),
                configJsSrcFile = path.resolve(sourceFolder, configJsFile),
                configJsDestFile = path.resolve(destFolder, configJsFile);

            checkConfigJS(sourceFolder, configJsFile).then(() => {
                configJS = require(path.resolve(sourceFolder, configJsFile));

                copyDir(sourcePath, destPath).then(() => {
                    fs.readFile(configJsonSrcFile, "utf8")
                        .then(data => {
                            const migrated = {},
                                parsed = JSON.parse(data);

                            if (!parsed[PORTALCONFIG].mainMenu) {
                                console.info("\n#############################     migrate     #############################\n");
                                console.info("ATTENTION --- the following tools are not migrated: ", toolsNotToMigrate.join(", ") + "\n");
                                console.info("ATTENTION --- remove from config.js by yourself: ", toRemoveFromConfigJs.join(", ") + "\n");
                                console.info("source: ", configJsonSrcFile, "\ndestination: ", configJsonDestFile, "\n");
                                const gfi = migrateGFI(parsed);

                                migrated[PORTALCONFIG] = {};
                                migrated[PORTALCONFIG].mapView = readMapView(parsed);
                                migrated[PORTALCONFIG].portalFooter = migrateFooter(configJS);
                                migrated[PORTALCONFIG].controls = migrateControls(parsed);
                                if (gfi) {
                                    migrated[PORTALCONFIG].getFeatureInfo = gfi;
                                }
                                migrated[PORTALCONFIG].tree = migrateTree(parsed, configJS);
                                migrated[PORTALCONFIG].mainMenu = createMainMenu(parsed, configJS, migratedTools, toRemoveFromTools);
                                migrated[PORTALCONFIG].secondaryMenu = createSecondaryMenu(parsed, migratedTools, toRemoveFromTools);
                                migrated[TOPICS] = migrateTopics(parsed);

                                fs.mkdir(destPath, {recursive: true})
                                    .then(() => {
                                        fs.writeFile(configJsonDestFile, JSON.stringify(migrated, null, 4), "utf8")
                                            .then(() => {
                                                replaceInFile(configJsonDestFile);
                                                fs.copyFile(configJsSrcFile, configJsDestFile);
                                                migrateIndexHtml(sourceFolder, destFolder, indexFile);
                                                console.info("SUCCESSFULL MIGRATED: ", destFolder);
                                            })
                                            .catch(err => {
                                                console.error(err);
                                            });
                                    })
                                    .catch(err => {
                                        console.error(err);
                                    });
                            }
                            else {
                                console.warn("IS ALREADY IN V3.0.0 - NOT MIGRATED: ", configJsonSrcFile);
                            }
                        })
                        .catch(err => {
                            console.error(err);
                        });
                })
                    .catch(err => {
                        console.error(err);
                    });
            })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });
}


/**
 * Migrates config.json, config.js and index.html to version 3.0.0.
 * @param {Object} answers contains the sourcePath and the destPath
 * @returns {void}
 */
module.exports = function migrate (answers) {
    const sourcePath = path.resolve(rootPath, answers.sourcePath);

    fs.readdir(sourcePath)
        .then(files => {
            if (files.find(fileName => fileName === "config.json")) {
                migrateFiles(answers.sourcePath, answers.destPath);
            }
            else {
                files.forEach(file => {
                    const sourceFolder = path.resolve(sourcePath, file);

                    fs.readdir(sourceFolder)
                        .then(sourcePathFiles => {
                            if (sourcePathFiles.find(fileName => fileName === "config.json")) {
                                migrateFiles(answers.sourcePath + path.sep + file, answers.destPath + path.sep + file);
                            }
                        })
                        .catch(err => {
                            console.error(err);
                        });
                });
            }
        })
        .catch(err => {
            console.error(err);
        });
};

