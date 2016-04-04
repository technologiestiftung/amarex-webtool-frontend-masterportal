define([
    "backbone",
    "backbone.radio",
    "modules/core/util",
    "config",
    "modules/treeMobile/folderModel",
    "modules/treeMobile/itemModel",
    "modules/treeMobile/layerModel",
    "jqueryui/effect",
    "jqueryui/effect-slide"
], function () {

     var Backbone = require("backbone"),
         Util = require("modules/core/util"),
         Radio = require("backbone.radio"),
         Folder = require("modules/treeMobile/folderModel"),
         Item = require("modules/treeMobile/itemModel"),
         Layer = require("modules/treeMobile/layerModel"),
         Config = require("config"),
         treeNodes = [],
         TreeCollection;

    TreeCollection = Backbone.Collection.extend({
        // Pfad zur custom-treeconfig
        url: "tree-config.json",
        comparator: "type",
        model: function (attrs, options) {
            if (attrs.type === "folder") {
                return new Folder(attrs, options);
            }
            else if (attrs.type === "layer") {
                return new Layer(attrs, options);
            }
            else if (attrs.type === "item") {
                return new Item(attrs, options);
            }
        },

        initialize: function () {
            var channel = Radio.channel("TreeList");

            channel.on({
                "updateList": this.updateList,
                "checkIsExpanded": this.checkIsExpanded
            }, this);

            this.listenTo(this, {
                "change:isChecked": this.toggleIsChecked
            });

            this.addMenuItems();
            this.addToolItems();

            switch (Config.tree.type){
                case "default": {
                    this.addTreeMenuItems();
                    this.parseLayerList();
                    break;
                }
                case "light": {
                    this.parseLightTree();
                    break;
                }
                case "custom": {
                    this.addTreeMenuItems();
                    this.fetchTreeConfig();
                    break;
                }
            }
        },

        /**
        * Ließt aus der Config aus, welche Menüeinträge
        * angezeigt werden sollen und erzeugt daraus die
        * oberen statischen Menüelmente (alles außer den Baum)
        */
        addMenuItems: function () {
            _.each(Config.menuItems, function (value, key) {
                this.add({
                    type: (key === "tree" || key === "tools") ? "folder" : "item",
                    title: value.title,
                    glyphicon: value.glyphicon,
                    isRoot: true,
                    id: key,
                    parentId: "main"
                });
            }, this);
        },

        /**
         * Erstellt die 1. Themenbaum-Ebene bei custom und default (Hintergrundkarten, Fachdaten und Auswahlt der Karten).
         */
        addTreeMenuItems: function () {
            this.add({
                type: "folder",
                title: "Hintergrundkarten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "BaseLayer",
                parentId: "tree"
            });
            this.add({
                type: "folder",
                title: "Fachdaten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "OverLayer",
                parentId: "tree"
            });
            this.add({
                type: "folder",
                title: "Auswahl der Karten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "SelectedLayer",
                parentId: "tree",
                isLeafFolder: true
            });
        },

        addToolItems: function () {
            _.each(Config.tools, function (value) {
                this.add({
                    type: "item",
                    title: value.title,
                    glyphicon: value.glyphicon,
                    parentId: "tools"
                });
            }, this);
        },
        /**
        * Ließt aus der Config die Layer aus und
        * erzeugt daraus einen Baum mit nur einer Ebene.
        * In dieser Ebene sind alle Layer
        */
        parseLightTree: function () {
            var layerList = Radio.request("LayerList", "getLayerList");

            _.each(layerList, function (element) {
                this.add({
                    type: "layer",
                    parentId: "tree",
                    layerId: element.get("id"),
                    title: element.get("name")
                });
            }, this);
        },
        /**
        * Lädt eine Treeconfig und erzeugt daraus einen Baum
        * die Treeconfig wird in parse() geparst
        */
        fetchTreeConfig: function () {
            this.fetch({
                remove: false,
                async: false,
                beforeSend: Util.showLoader(),
                success: function () {
                    Util.hideLoader();
                }
            });
        },
        /**
         * parsed die gefetchte Treeconfig
         * @param  {Object} response - Die treeConfig JSON
         */
        parse: function (response) {
            // key = Hintergrundkarten || Fachdaten || Ordner
            // value = Array von Objekten (Layer || Ordner)
            _.each(response, function (value, key) {
                var parentId = "";

                if (key === "Hintergrundkarten") {
                    parentId = "BaseLayer";
                }
                else if (key === "Fachdaten") {
                    parentId = "OverLayer";
                }
                else {
                    parentId = value[0].id;
                }

                _.each(value, function (element) {
                    if (_.has(element, "Layer")) {
                        _.each(element.Layer, function (layer) {
                            treeNodes.push({
                                type: "layer",
                                parentId: parentId,
                                layerId: layer.id
                            });
                        });
                    }
                    if (_.has(element, "Ordner")) {
                        _.each(element.Ordner, function (folder) {
                            folder.id = _.uniqueId(folder.Titel);
                            treeNodes.push({
                                type: "folder",
                                parentId: parentId,
                                title: folder.Titel,
                                id: folder.id,
                                isLeafFolder: (!_.has(folder, "Ordner")) ? true : false
                            });
                            // rekursiver Aufruf
                            this.parse({"Ordner": [folder]});
                        }, this);
                    }
                }, this);
            }, this);

            return treeNodes;
        },
        /**
         * Erzeugt aus einem Übergebenen Array Layer Models
         * und fügt sie alphabetisch sortiert der collection hinzu
         * @param  {array} layers   ein array mit Modeln
         * @param  {String} parentId die Id des Eltern Model
         */
        createLayersModels: function (layers, parentId) {

            layers = _.sortBy(layers, function (layer) {
                return layer.attributes.name.trim().toUpperCase();
            });
            var nodes = [];

            _.each(layers, function (layer) {
                nodes.push({
                    type: "layer",
                    parentId: parentId,
                    layerId: layer.id,
                    title: layer.attributes.name
                });
            });
            this.add(nodes);
        },
        /**
         * Erzeugt aus einem Übergebenen Array Ordner Models
         * und fügt sie alphabetisch sortiert der collection hinzu
         * @param  {array} folder   ein array mit Modeln
         * @param  {String}  parentId die Id des Eltern Model
         */
        createFolderModels: function (folders, parentId) {
            folders = _.sortBy(folders, function (folder) {
                    return folder.title.trim().toUpperCase();
                });

            var nodes = [];

            _.each(folders, function (folder) {
                nodes.push({
                    type: "folder",
                    parentId: parentId,
                    title: folder.title,
                    id: folder.id,
                    isLeafFolder: (_.has(folder, "folder")) ? false : true
                });
            }, this);
            this.add(nodes);
        },
        /**
        * Holt sich die Liste detr Layer aus dem Layermodul
        * und erzeugt daraus einen Baum
        */
        parseLayerList: function () {
            var layerList = Radio.request("LayerList", "getLayerList"),
                // Unterscheidung nach Overlay und Baselayer
                typeGroup = _.groupBy(layerList, function (layer) {
                return (layer.attributes.isbaselayer) ? "baselayer" : "overlay";
            });
            // Models für die Baselayer erzeugen
            this.createLayersModels(typeGroup.baselayer, "BaseLayer");
            // Models für die Fachdaten erzeugen
            this.groupDefaultTreeOverlays(typeGroup.overlay);

        },

        /**
         * unterteilung der nach metaName groupierten Layer in Ordner und Layer
         * wenn eine MetaNameGroup nur einen Eintrag hat soll sie
         * als Layer und nicht als Ordner hinzugefügt werden
        */
        splitIntoFolderAndLayer: function (metaNameGroups, title) {
            var folder = [],
                layer = [],
                categories = {};

            _.each(metaNameGroups, function (group, groupTitle) {
                // Wenn eine Gruppe mehr als einen Eintrag hat -> Ordner erstellen
                if (Object.keys(group).length > 1) {
                    folder.push({
                        title: groupTitle,
                        layer: group,
                        id: _.uniqueId(groupTitle)
                    });
                }
                else {
                    layer.push(group[0]);
                }
                categories.folder = folder;
                categories.layer = layer;
                categories.id = _.uniqueId(title);
                categories.title = title;
            });
            return categories;
        },
        /**
         * Gruppiert die Layer nach Kategorie und MetaName
         * @param  {Object} overlays die Fachdaten als Object
         */
        groupDefaultTreeOverlays: function (overlays) {
            var tree = {},
                // Gruppierung nach Opendatakategorie
                categoryGroups = _.groupBy(overlays, function (layer) {
                return layer.attributes.node;
            });
           // Gruppierung nach MetaName
            _.each(categoryGroups, function (group, title) {
                var metaNameGroups = _.groupBy(group, function (layer) {
                    return layer.attributes.metaName;
                });
                // in Layer und Ordner unterteilen
                tree[title] = this.splitIntoFolderAndLayer(metaNameGroups, title);
            }, this);
            this.createModelsForDefaultTree(tree);
        },
        /**
         * Erzeugt alle Models für den DefaultTree
         * @param  {Object} tree aus den categorien und MetaNamen erzeugter Baum
         */
        createModelsForDefaultTree: function (tree) {
            var sortedKeys = Object.keys(tree).sort(),
                sortedCategories = [];

            _.each(sortedKeys, function (key) {
                sortedCategories.push(tree[key]);
            });
            // Kategorien erzeugen
            this.createFolderModels(sortedCategories, "OverLayer");

            _.each(tree, function (category) {
                // Unterordner erzeugen
                this.createFolderModels(category.folder, category.id);
                this.createLayersModels(category.layer, category.id);
                _.each(category.folder, function (folder) {
                    // Layer in der untertestenEbene erzeugen
                    this.createLayersModels(folder.layer, folder.id);
                }, this);
            }, this);
        },

        /**
         * [updateList description]
         * @param  {[type]} value [description]
         */
        updateList: function (value, slideDirection) {
            this.setAllModelsInvisible();
            this.setModelsVisible(value);
            this.sort({slideDirection: slideDirection});
        },

        /**
         * [checkIsExpanded description]
         * @return {[type]} [description]
         */
        checkIsExpanded: function () {
            var folderModel = this.findWhere({isExpanded: true});

            if (!_.isUndefined(folderModel)) {
                folderModel.setIsExpanded(false);
            }
        },

        /**
        * Setzt bei Änderung der Ebene, alle Model
        * auf der neuen Ebene auf sichtbar
        * @param {int} parentId Die Id des Objektes dessen Kinder angezeigt werden sollen
        */
        setModelsVisible: function (parentId) {
            var children = this.where({parentId: parentId}),
                // Falls es ein LeafFolder ist --> "Alle auswählen" Template
                selectedLeafFolder = this.where({id: parentId, isLeafFolder: true});

            _.each(_.union(selectedLeafFolder, children), function (model) {
                model.setIsVisible(true);
            });
        },

        /**
         * Setzt alle Model unsichtbar
         */
        setAllModelsInvisible: function () {
            this.forEach(function (model) {
                model.setIsVisible(false);
            });
        },

        /**
         * Alle Models von einem Leaffolder werden selektiert
         * @param {String} parentId Die ID des Objektes dessen Kinder alle auf "checked" gesetzt werden
         */
         toggleIsChecked: function (model) {
             if (model.getType() === "folder") {
                 var children = this.where({parentId: model.getId()});

                 _.each(children, function (child) {
                     child.toggleIsChecked(model.getIsChecked());
                 });
             }
         },

        /**
        * Setzt bei Änderung der Ebene, alle Model
        * auf der alten Ebene auf unsichtbar
        * darf erst aufgerufen werden, nachdem
        * die Animation der ebenänderung fertig ist
        * @param {int} parentId Die ID des Objektes dessen Kinder nicht mehr angezeigt werden sollen
        */
        setModelsInvisible: function (parentId) {}
    });

    return TreeCollection;
});
