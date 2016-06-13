define([
    "backbone",
    "backbone.radio",
    "config",
    "modules/core/util"
], function () {

    var Backbone = require("backbone"),
        Radio = require("backbone.radio"),
        Config = require("config"),
        Util = require("modules/core/util"),
        RawLayerList;

    RawLayerList = Backbone.Collection.extend({
        // URL zur services.json
        url: Util.getPath(Config.layerConf),
        initialize: function () {
            var channel = Radio.channel("RawLayerList");

            channel.reply({
                "getLayerWhere": this.getLayerWhere,
                "getLayerListWhere": this.getLayerListWhere,
                "getLayerAttributesList": this.getLayerAttributesList
            }, this);

            this.fetch({async: false});
        },

        /**
         * Verarbeitet die Objekte aus der services.json und gibt nur diejenigen zurück, die der Collection hinzugefügt werden sollen
         * @param  {Object[]} response - Objekte aus der services.json
         * @return {Object[]} response - Objekte aus der services.json
         */
        parse: function (response) {
            // Im FHH-Atlas und GeoOnline werden nur WMS angezeigt --> tree.type = default
            // Und nur Layer die einem Metadatensatz zugeordnet sind
            if (Config.tree.type === "default") {
                response = this.filterForDefault(response);
            }
            // Es gibt Layer in einem Dienst, die für unterschiedliche Portale unterschiedliche Daten/GFIs liefern --> z.B. Hochwasserrisikomanagement
            // Da alle Layer demselben Metadtaensatz zugordnet sind, werden sie über die Id gelöscht
            if (_.has(Config.tree, "layerIDsToIgnore")) {
                response = this.deleteLayersByIds(response, Config.tree.layerIDsToIgnore);
            }
            // Alle Layer eines Metadatensatzes die nicht dargestellt werden sollen --> z.B. MRH Fachdaten im FHH-Atlas
            if (_.has(Config.tree, "metaIDsToIgnore")) {
                response = this.deleteLayersByMetaIds(response, Config.tree.metaIDsToIgnore);
            }
            // Layer eines Metadatensatzes (nicht alle) die gruppiert werden sollen --> z.B. Geobasisdaten (farbig)
            // Da alle Layer demselben Metadtaensatz zugordnet sind, werden sie über die Id gruppiert
            if (_.has(Config.tree, "layerIDsToMerge")) {
                response = this.mergeLayersByIds(response, Config.tree.layerIDsToMerge);
            }
            // Alle Layer eines Metadatensatzes die gruppiert dargestellt werden sollen --> z.B. Bauschutzbereich § 12 LuftVG Hamburg im FHH-Atlas
            if (_.has(Config.tree, "metaIDsToMerge")) {
                response = this.mergeLayersByMetaIds(response, Config.tree.metaIDsToMerge);
            }

            return response;
        },

        /**
         * Filtert alle Objekte aus der response, die kein WMS sind und min. einem Datensatz zugordnet sind
         * @param  {Object[]} response - Objekte aus der services.json
         * @return {Object[]} response - Objekte aus der services.json
         */
        filterForDefault: function (response) {
            return _.filter(response, function (element) {
                return (element.datasets.length > 0 && element.typ === "WMS") ;
            });
        },

        /**
         * Entfernt Objekte aus der response, die mit einer der übergebenen Ids übereinstimmen
         * @param  {Object[]} response - Objekte aus der services.json
         * @param  {string[]} ids - Ids von Objekten die entfernt werden
         * @return {Object[]} response - Objekte aus der services.json
         */
        deleteLayersByIds: function (response, ids) {
            return _.reject(response, function (element) {
                return _.contains(ids, element.id);
            });
        },

        /**
         * Entfernt Objekte aus der response, die mit einer der übergebenen Metadaten-Ids übereinstimmen
         * @param  {Object[]} response - Objekte aus der services.json
         * @param  {string[]} metaIds - Metadaten-Ids von Objekten die entfernt werden
         * @return {Object[]} response - Objekte aus der services.json
         */
        deleteLayersByMetaIds: function (response, metaIds) {
            return _.filter(response, function (element) {
                return element.datasets.length === 0 || _.contains(metaIds, element.datasets[0].md_id) === false;
            });
        },

        /**
         * Gruppiert Objekte aus der response, die mit den Ids in der übergebenen Liste übereinstimmen
         * @param  {Object[]} response - Objekte aus der services.json
         * @param  {string[]} ids - Array von Ids deren Objekte gruppiert werden
         * @return {Object[]} response - Objekte aus der services.json
         */
        mergeLayersByIds: function (response, ids) {
            var objectsByIds,
                newObject;

            _.each(ids, function (groupedIds) {
                // Objekte die gruppiert werden
                objectsByIds = _.filter(response, function (object) {
                    return _.contains(groupedIds, object.id);
                });
                // Das erste Objekt wird kopiert
                newObject = _.clone(objectsByIds[0]);
                // Das Attribut layers wird gruppiert und am kopierten Objekt gesetzt
                newObject.layers = _.pluck(objectsByIds, "layers").toString();
                // Das Attribut maxScale wird gruppiert
                // Am kopierten Objekt wird der höchste Wert gesetzt
                newObject.maxScale = _.max(_.pluck(objectsByIds, "maxScale"), function (scale) {
                    return parseInt(scale, 10);
                });
                // Das Attribut minScale wird gruppiert
                // Am kopierten Objekt wird der niedrigste Wert gesetzt
                newObject.minScale = _.min(_.pluck(objectsByIds, "minScale"), function (scale) {
                    return parseInt(scale, 10);
                });
                // Entfernt alle zu "gruppierenden" Objekte aus der response
                response = _.difference(response, objectsByIds);
                // Fügt das kopierte (gruppierte) Objekt der response hinzu
                response.push(newObject);
            });

            return response;
        },

        /**
         * Gruppiert Objekte aus der response, die mit einer der übergebenen Metadaten-Ids übereinstimmen
         * @param {Object[]} response - Objekte aus der services.json
         * @param  {string[]} metaIds - Metadaten-Ids von Objekten die gruppiert werden
         * @return {Object[]} response - Objekte aus der services.json
         */
        mergeLayersByMetaIds: function (response, metaIds) {
            var objectsById,
                newObject;

            _.each(metaIds, function (metaID) {
                // Objekte mit derselben Metadaten-Id
                objectsById = _.filter(response, function (layer) {
                    return layer.datasets[0].md_id === metaID;
                });
                // Das erste Objekt wird kopiert
                newObject = _.clone(objectsById[0]);
                // Das kopierte Objekt bekommt den gleichen Namen wie der Metadatensatz
                newObject.name = objectsById[0].datasets[0].md_name;
                // Das Attribut layers wird gruppiert und am kopierten Objekt gesetzt
                newObject.layers = _.pluck(objectsById, "layers").toString();
                // Das Attribut maxScale wird gruppiert und der höchste Wert am kopierten Objekt gesetzt
                newObject.maxScale = _.max(_.pluck(objectsById, "maxScale"), function (scale) {
                    return parseInt(scale, 10);
                });
                // Das Attribut minScale wird gruppiert und der niedrigste Wert am kopierten Objekt gesetzt
                newObject.minScale = _.min(_.pluck(objectsById, "minScale"), function (scale) {
                    return parseInt(scale, 10);
                });
                // Entfernt alle zu "gruppierenden" Objekte aus der response
                response = _.difference(response, objectsById);
                // Fügt das kopierte (gruppierte) Objekt der response hinzu
                response.push(newObject);
            });

            return response;
        },

        /**
         * Liefert das erste Model zurück, das den Attributen entspricht
         * @param  {Object} attributes
         * @return {Backbone.Model[]} - Liste der Models
         */
        getLayerWhere: function (attributes) {
            return this.findWhere(attributes);
        },

         /**
          * Liefert ein Array aller Models zurück, die mit den übergebenen Attributen übereinstimmen
          * @param  {Object} attributes
          * @return {Backbone.Model[]} - Liste der Models
          */
        getLayerListWhere: function (attributes) {
            return this.where(attributes);
        },

        /**
         * Liefert ein Array zurück, welches die Modelattribute eines jeden Model enthält
         * @return {Object[]} - Liste der Modelattribute
         */
        getLayerAttributesList: function () {
            return this.toJSON();
        }
    });

    return RawLayerList;
});
