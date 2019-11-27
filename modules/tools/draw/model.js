import {Select, Modify, Draw} from "ol/interaction.js";
import {Circle, Fill, Stroke, Style, Text} from "ol/style.js";
import {GeoJSON} from "ol/format.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import MultiPoint from "ol/geom/MultiPoint.js";
import MultiLine from "ol/geom/MultiLineString.js";
import {fromCircle as circPoly} from "ol/geom/Polygon.js";
import Feature from "ol/Feature";
import Tool from "../../core/modelList/tool/model";
import {toLonLat, transform} from "ol/proj";

const DrawTool = Tool.extend(/** @lends DrawTool.prototype */{
    defaults: Object.assign({}, Tool.prototype.defaults, {
        drawInteraction: undefined,
        selectInteraction: undefined,
        modifyInteraction: undefined,
        layer: undefined,
        font: "Arial",
        fontSize: 10,
        text: "Klicken Sie auf die Karte um den Text zu platzieren",
        circleRadiusInner: 0,
        circleRadiusOuter: 0,
        color: [55, 126, 184, 1],
        colorContour: [55, 126, 184, 1],
        radius: 6,
        strokeWidth: 1,
        opacity: 1,
        drawType: {
            geometry: "Point",
            text: "Punkt zeichnen"
        },
        renderToWindow: true,
        deactivateGFI: true,
        glyphicon: "glyphicon-pencil",
        addFeatureListener: {},
        zIndex: 0
    }),

    /**
     * @class DrawModel
     * @extends Tool
     * @memberof Tools.Draw
     * @property {*} drawInteraction=undefined The draw interaction.
     * @property {*} selectInteraction=undefined The select interaction.
     * @property {*} modifyInteraction=undefined The modify interaction.
     * @property {ol/layer} layer=undefined The layer for the drawn features.
     * @property {String} font="Arial" Selected font of the model.
     * @property {Number} fontSize=10 Selected fontSize of the model.
     * @property {String} text="Klicken Sie auf die Karte um den Text zu platzieren" Placeholder.
     * @property {Number[]} color=[55, 126, 184, 1] Selectd color in rgba array.
     * @property {Number} radius=6 Selected radius.
     * @property {Number} strokeWidth=1 Selected stroke width.
     * @property {Number} opacity=1 Selected opacity.
     * @property {Object} drawType The drawType.
     * @property {String} drawType.geometry The geometry of the draw type.
     * @property {String} drawType.text The placeholder text.
     * @property {Boolean} renderToWindow=true Flag to render in tool window.
     * @property {Boolean} deactivateGFI=true Flag to deactivate GFI if draw tool gets activated.
     * @property {String} glyphicon="glyphicon-pencil" CSS glyphicon class.
     * @property {Object} addFeatureListener Listener.
     * @property {Number} zIndex=0 zIndex.
     * @listens Tools.Draw#RadioRequestDrawGetLayer
     * @listens Tools.Draw#RadioRequestDrawDownloadWithoutGUI
     * @listens Tools.Draw#RadioTriggerDrawInitWithoutGUI
     * @listens Tools.Draw#RadioTriggerDeleteAllFeatures
     * @listens Tools.Draw#RadioTriggerCancelDrawWithoutGUI
     * @listens Tools.Draw#RadioTriggerDownloadViaRemoteInterface
     * @fires RemoteInterface#RadioTriggerRemoteInterfacePostMessage
     * @constructs
     */
    initialize: function () {
        const channel = Radio.channel("Draw");

        this.superInitialize();

        this.setMethodCircle("interaktiv");

        channel.reply({
            "getLayer": function () {
                return this.get("layer");
            },
            "downloadWithoutGUI": this.downloadFeaturesWithoutGUI
        }, this);

        channel.on({
            "initWithoutGUI": this.inititalizeWithoutGUI,
            "deleteAllFeatures": this.deleteFeatures,
            "editWithoutGUI": this.editFeaturesWithoutGUI,
            "cancelDrawWithoutGUI": this.cancelDrawWithoutGUI,
            "downloadViaRemoteInterface": this.downloadViaRemoteInterface
        }, this);

        this.listenTo(this, {
            "change:isActive": function (model, value) {
                var layer = model.createLayer(model.get("layer"));

                if (value) {
                    this.setLayer(layer);
                    this.createDrawInteractionAndAddToMap(layer, this.get("drawType"), true);
                    this.createSelectInteractionAndAddToMap(layer, false);
                    this.createModifyInteractionAndAddToMap(layer, false);
                    this.off(this);
                }
            }
        });

        Radio.trigger("RemoteInterface", "postMessage", {"initDrawTool": true});
    },

    /**
     * Creates an addfeature-Listener
     * @param   {ol.layer} layer - Layer, to which the Listener is registered.
     * @param   {Boolean} doubleIsActive - Boolean to compute a double circle or single circle.
     * @returns {void}
     */
    createSourceListenerForStyling: function (layer, doubleIsActive) {
        var layerSource = layer.getSource();

        this.setAddFeatureListener(layerSource.on("addfeature", function (evt) {
            if (this.get("methodCircle") === "definiert" && this.get("drawType").geometry === "Circle") {
                this.setDoubleCircle(doubleIsActive);
                this.getDefinedRadius(evt);
                evt.feature.setStyle(this.getStyle());
                evt.feature.style_.text_ = "";
                this.countupZIndex();
            }
            else {
                this.setDoubleCircle(false);
                evt.feature.setStyle(this.getStyle());
                evt.feature.style_.text_ = "";
                this.countupZIndex();
            }
        }.bind(this)));
    },

    /**
     * Getter to get the radius of the inner or outer circle.
     * @param   {Event} evt - DrawEvent with the drawn-feature.
     * @returns {void}
     */
    getDefinedRadius: function (evt) {
        let circleRadius;

        if (this.get("Doppelkreis") === true) {
            circleRadius = this.get("circleRadiusOuter");
        }
        else {
            circleRadius = this.get("circleRadiusInner");
        }
        this.addNewCoordinatesToFeature(evt, circleRadius);
    },

    /**
     * Overwrites the flat coordinates of an existing (circle-) feature with recalculated ones.
     * @param   {Event} evt - DrawEvent with the drawn-feature.
     * @param   {Number} circleRadius - Diameter of the inner or outer circle, specified by the user.
     * @returns {void}
     */
    addNewCoordinatesToFeature: function (evt, circleRadius) {
        const circleCenter = evt.feature.getGeometry().getCenter(),
            coordinatesCircle = this.newPointInDistance(circleCenter, circleRadius);

        circleCenter.push(coordinatesCircle[0], coordinatesCircle[1]);
        evt.feature.getGeometry().flatCoordinates = circleCenter;
    },

    /**
     * Calculates new flat coordinates for the (circle-) feature.
     * These coordiantes are calculated on the basis of the circle diameter specified by the user.
     * @param   {Array} circleCenter - Centercoordinates of the circle.
     * @param   {Array} circleRadius - Diameter of the new circle.
     * @returns {Array} - returns new and transformed flat coordinates of the circle.
     */
    newPointInDistance: function (circleCenter, circleRadius) {
        const earthRadius = 6378137,
            offsetLat = circleRadius / 2,
            circleCenterWGS = toLonLat(circleCenter, "EPSG:25832"),
            deltaLat = offsetLat / earthRadius,
            newPositionLat = circleCenterWGS[1] + deltaLat * 180 / Math.PI;

        return transform([circleCenterWGS[0], newPositionLat], "EPSG:4326", "EPSG:25832");
    },

    /**
     * initialises the drawing functionality without a GUI
     * useful for instance for the use via RemoteInterface
     * @param {String} para_object - an Object which includes the parameters
     *                 {String} drawType - which type is meant to be drawn ["Point", "LineString", "Polygon", "Circle"]
     *                 {String} color - color, in rgb (default: "55, 126, 184")
     *                 {Float} opacity - transparency (default: 1.0)
     *                 {Integer} maxFeatures - maximum number of Features allowed to be drawn (default: unlimeted)
     *                 {String} initialJSON - GeoJSON containing the Features to be drawn on the Layer, i.e. for editing
     *                 {Boolean} transformWGS - The GeoJSON will be transformed from WGS84 to UTM if set to true
     *                 {Boolean} zoomToExtent - The map will be zoomed to the extent of the GeoJson if set to true
     * @returns {String} GeoJSON of all Features as a String
     */
    inititalizeWithoutGUI: function (para_object) {
        var featJSON,
            newColor,
            format = new GeoJSON(),
            initJson = para_object.initialJSON,
            zoomToExtent = para_object.zoomToExtent,
            transformWGS = para_object.transformWGS;

        if (this.collection) {
            this.collection.setActiveToolsToFalse(this);
        }

        this.set("renderToWindow", false);
        this.setIsActive(true);

        if ($.inArray(para_object.drawType, ["Point", "LineString", "Polygon", "Circle"]) > -1) {
            this.setDrawType(para_object.drawType, para_object.drawType + " zeichnen");
            if (para_object.color) {
                this.set("color", para_object.color);
            }
            if (para_object.opacity) {
                newColor = this.get("color");

                newColor[3] = parseFloat(para_object.opacity);
                this.setColor(newColor);
                this.setOpacity(para_object.opacity);
            }

            // this.createDrawInteraction(this.get("drawType"), this.get("layer"), para_object.maxFeatures);
            this.createDrawInteractionAndAddToMap(this.get("layer"), this.get("drawType"), true, para_object.maxFeatures);

            if (initJson) {
                try {

                    if (transformWGS === true) {
                        format = new GeoJSON({
                            defaultDataProjection: "EPSG:4326"
                        });
                        // read GeoJson and transfrom the coordiantes from WGS84 to UTM
                        featJSON = format.readFeatures(initJson, {
                            dataProjection: "EPSG:4326",
                            featureProjection: "EPSG:25832"
                        });
                    }
                    else {
                        featJSON = format.readFeatures(initJson);
                    }

                    if (featJSON.length > 0) {
                        this.get("layer").setStyle(this.getStyle(para_object.drawType));
                        this.get("layer").getSource().addFeatures(featJSON);
                    }

                    if (featJSON.length > 0 && zoomToExtent === true) {
                        Radio.trigger("Map", "zoomToExtent", this.get("layer").getSource().getExtent());
                    }
                }
                catch (e) {
                    // das übergebene JSON war nicht gültig
                    Radio.trigger("Alert", "alert", "Die übergebene Geometrie konnte nicht dargestellt werden.");
                }
            }
        }
    },
    /**
     * enable editing of already drawn Features without a GUI
     * usefule for instance for the use via RemoteInterface
     * @returns {void}
     */
    editFeaturesWithoutGUI: function () {
        this.deactivateDrawInteraction();
        this.createModifyInteractionAndAddToMap(this.get("layer"), true);
    },

    /**
     * creates and returns a GeoJSON of all drawn Features without a GUI
     * returns an empty Object if no init happened previously (= no layer set)
     * by default single geometries are added to the GeoJSON
     * if geomType is set to "multiGeometry" multiGeometry Features of all drawn Features are created for each geometry type individually
     * @param {String} para_object - an Object which includes the parameters
     *                 {String} geomType singleGeometry (default) or multiGeometry ("multiGeometry")
     *                 {Boolean} transformWGS if true, the coordinates will be transformed from WGS84 to UTM
     * @returns {String} GeoJSON all Features as String
     */
    downloadFeaturesWithoutGUI: function (para_object) {
        var features = null,
            format = new GeoJSON(),
            geomType = null,
            transformWGS = null,
            multiPolygon = new MultiPolygon([]),
            multiPoint = new MultiPoint([]),
            multiLine = new MultiLine([]),
            multiGeomFeature = null,
            circleFeature = null,
            circularPoly = null,
            featureType = null,
            featureArray = [],
            singleGeom = null,
            multiGeom = null,
            featuresConverted = {"type": "FeatureCollection", "features": []};

        if (!_.isUndefined(para_object) && para_object.geomType === "multiGeometry") {
            geomType = "multiGeometry";
        }
        if (!_.isUndefined(para_object) && para_object.transformWGS === true) {
            transformWGS = true;
        }

        if (!_.isUndefined(this.get("layer")) && !_.isNull(this.get("layer"))) {
            features = this.get("layer").getSource().getFeatures();

            if (geomType === "multiGeometry") {

                _.each(features, function (item) {
                    featureType = item.getGeometry().getType();

                    if (featureType === "Polygon") {
                        if (transformWGS === true) {
                            multiPolygon.appendPolygon(item.getGeometry().clone().transform("EPSG:25832", "EPSG:4326"));
                        }
                        else {
                            multiPolygon.appendPolygon(item.getGeometry());
                        }
                    }
                    else if (featureType === "Point") {
                        if (transformWGS === true) {
                            multiPoint.appendPoint(item.getGeometry().clone().transform("EPSG:25832", "EPSG:4326"));
                        }
                        else {
                            multiPoint.appendPoint(item.getGeometry());
                        }
                    }
                    else if (featureType === "LineString") {
                        if (transformWGS === true) {
                            multiLine.appendLineString(item.getGeometry().clone().transform("EPSG:25832", "EPSG:4326"));
                        }
                        else {
                            multiLine.appendLineString(item.getGeometry());
                        }
                    }
                    // Circles cannot be added to a featureCollection
                    // They must therefore be converted into a polygon
                    else if (featureType === "Circle") {
                        if (transformWGS === true) {
                            circularPoly = circPoly(item.getGeometry().clone().transform("EPSG:25832", "EPSG:4326"), 64);
                            multiPolygon.appendPolygon(circularPoly);
                        }
                        else {
                            circularPoly = circPoly(item.getGeometry(), 64);
                            multiPolygon.appendPolygon(circularPoly);
                        }
                    }
                    else if (featureType === "MultiPolygon" || featureType === "MultiPoint" || featureType === "MultiLineString") {
                        if (transformWGS === true) {
                            multiGeom = item.clone();
                            multiGeom.getGeometry().transform("EPSG:25832", "EPSG:4326");
                        }
                        else {
                            multiGeom = item;
                        }
                        featureArray.push(multiGeom);
                    }

                });

                if (multiPolygon.getCoordinates().length > 0) {
                    multiGeomFeature = new Feature(multiPolygon);
                    featureArray.push(multiGeomFeature);
                }
                if (multiPoint.getCoordinates().length > 0) {
                    multiGeomFeature = new Feature(multiPoint);
                    featureArray.push(multiGeomFeature);
                }
                if (multiLine.getCoordinates().length > 0) {
                    multiGeomFeature = new Feature(multiLine);
                    featureArray.push(multiGeomFeature);
                }
                // The features in the featureArray are converted into a feature collection.
                // Note, any text added using the draw / text tool is not included in the feature collection
                // created by writeFeaturesObject(). If any text needs to be included in the feature collection's
                // properties the feature collection needs to be created in a different way. The text content can be
                // retrieved by item.getStyle().getText().getText().
                featuresConverted = format.writeFeaturesObject(featureArray);

            }
            else {
                _.each(features, function (item) {
                    featureType = item.getGeometry().getType();

                    if (transformWGS === true) {
                        singleGeom = item.clone();
                        singleGeom.getGeometry().transform("EPSG:25832", "EPSG:4326");
                    }
                    else {
                        singleGeom = item;
                    }

                    // Circles cannot be added to a featureCollection
                    // They must therefore be converted into a polygon
                    if (featureType === "Circle") {
                        circularPoly = circPoly(singleGeom.getGeometry(), 64);
                        circleFeature = new Feature(circularPoly);
                        featureArray.push(circleFeature);
                    }
                    else {
                        featureArray.push(singleGeom);
                    }
                });
                // The features in the featureArray are converted into a feature collection.
                // Note, any text added using the draw / text tool is not included in the feature collection
                // created by  writeFeaturesObject(). If any text needs to be included in the feature collection's
                // properties the feature collection needs to be created in a different way. The text content can be
                // retrieved by item.getStyle().getText().getText().
                featuresConverted = format.writeFeaturesObject(featureArray);

            }
        }

        return JSON.stringify(featuresConverted);
    },
    /**
     * sends the generated GeoJSON to the RemoteInterface in order to communicate with an iframe
     * @param {String} geomType singleGeometry (default) or multiGeometry ("multiGeometry")
     * @returns {void}
     */
    downloadViaRemoteInterface: function (geomType) {
        var result = this.downloadFeaturesWithoutGUI(geomType);

        Radio.trigger("RemoteInterface", "postMessage", {
            "downloadViaRemoteInterface": "function identifier",
            "success": true,
            "response": result
        });
    },
    /**
     * finishes the draw interaction via Radio
     * @param {String} cursor check and receive the parameter from Cockpit
     * @returns {void}
     */
    cancelDrawWithoutGUI: function (cursor) {
        this.deactivateDrawInteraction();
        this.deactivateSelectInteraction();
        this.deactivateModifyInteraction();
        this.resetModule();
        // Turn GFI on again after drawing
        this.setIsActive(false);
        if (cursor !== undefined && cursor.cursor) {
            $("#map").removeClass("no-cursor");
        }
    },

    /**
     * creates a vector layer for drawn features, if layer input is undefined
     * and removes this callback from the change:isCurrentWin event
     * because only one layer to be needed
     * @param {ol/layer/Vector} layer - could be undefined
     * @return {ol/layer/Vector} vectorLayer
     */
    createLayer: function (layer) {
        var vectorLayer = layer;

        if (_.isUndefined(vectorLayer)) {
            vectorLayer = Radio.request("Map", "createLayerIfNotExists", "import_draw_layer");
        }

        return vectorLayer;
    },
    createDrawInteractionAndAddToMap: function (layer, drawType, isActive, maxFeatures) {
        const drawInteraction1 = this.createDrawInteraction(drawType, layer);

        this.processDrawInteraction(drawInteraction1, isActive, maxFeatures, false);

        if (this.get("drawType").text === "Doppelkreis zeichnen") {
            const drawInteraction2 = this.createDrawInteraction(drawType, layer);

            this.processDrawInteraction(drawInteraction2, isActive, maxFeatures, true);
        }
    },

    processDrawInteraction: function (drawInteraction, isActive, maxFeatures, doubleIsActive) {
        drawInteraction.setActive(isActive);
        this.setDrawInteraction(drawInteraction);
        this.createDrawInteractionListener(drawInteraction, maxFeatures, doubleIsActive);
        Radio.trigger("Map", "addInteraction", drawInteraction);
    },
    createSelectInteractionAndAddToMap: function (layer, isActive) {
        var selectInteraction = this.createSelectInteraction(layer);

        selectInteraction.setActive(isActive);
        this.setSelectInteraction(selectInteraction);
        this.createSelectInteractionListener(selectInteraction, layer);
        Radio.trigger("Map", "addInteraction", selectInteraction);
    },
    createModifyInteractionAndAddToMap: function (layer, isActive) {
        var modifyInteraction = this.createModifyInteraction(layer);

        modifyInteraction.setActive(isActive);
        this.setModifyInteraction(modifyInteraction);
        Radio.trigger("Map", "addInteraction", modifyInteraction);
    },

    /**
     * creates the draw interaction to draw in the map
     * @param {object} drawType - contains the geometry and description
     * @param {ol/layer/Vector} layer - layer to draw
     * @param {array} color - of geometries
     * @return {ol/interaction/Draw} draw
     */
    createDrawInteraction: function (drawType, layer) {
        return new Draw({
            source: layer.getSource(),
            type: drawType.geometry,
            style: this.getStyle()
        });
    },

    /**
     * Listener to change the entries for the next drawing.
     * @param {ol/interaction/Draw} drawInteraction - drawInteraction
     * @param {integer} maxFeatures - maximal number of features to be drawn.
     * @param {Boolean} doubleIsActive -  - Boolean to compute a double circle or single circle.
     * @return {void}
     */
    createDrawInteractionListener: function (drawInteraction, maxFeatures, doubleIsActive) {
        var that = this;

        drawInteraction.on("drawstart", function (evt) {
            that.drawInteractionOnDrawevent(evt, drawInteraction, doubleIsActive);
        });

        drawInteraction.on("drawend", function (evt) {
            evt.feature.set("styleId", _.uniqueId());
            if (that.get("drawType").text === "Doppelkreis zeichnen") {
                drawInteraction.setActive(false);
            }
        });

        if (maxFeatures && maxFeatures > 0) {

            drawInteraction.on("drawstart", function () {
                var count = that.get("layer").getSource().getFeatures().length,
                    text = "";

                if (count > maxFeatures - 1) {
                    text = "Sie haben bereits " + maxFeatures + " Objekte gezeichnet, bitte löschen Sie erst eines, bevor Sie fortfahren!";
                    if (maxFeatures === 1) {
                        text = "Sie haben bereits " + maxFeatures + " Objekt gezeichnet, bitte löschen Sie dieses, bevor Sie fortfahren!";
                    }

                    Radio.trigger("Alert", "alert", text);
                    that.deactivateDrawInteraction();
                }
            }, this);
        }
    },

    drawInteractionOnDrawevent: function (evt, drawInteraction, doubleIsActive) {
        if (this.get("drawType").text === "Doppelkreis zeichnen") {
            this.setMethodCircle("definiert", "Doppelkreis zeichnen");
        }
        this.createSourceListenerForStyling(this.get("layer"), doubleIsActive);
        if (this.get("methodCircle") === "definiert") {
            drawInteraction.finishDrawing();
            this.setMethodCircle("interaktiv", "Kreis zeichnen");
        }
        evt.feature.set("styleId", _.uniqueId());
    },

    updateDrawInteraction: function () {
        Radio.trigger("Map", "removeInteraction", this.get("drawInteraction"));
        this.createDrawInteractionAndAddToMap(this.get("layer"), this.get("drawType"), true);
    },

    /**
     * Creates and returns the ol.style
     * @param {object} drawType - contains the geometry and description
     * @param {array} color - of drawings
     * @return {ol/style/Style} style
     */
    getStyle: function () {
        var style = new Style(),
            drawType = this.get("drawType"),
            color = this.get("color"),
            colorContour = this.get("colorContour"),
            text = this.get("text"),
            font = this.get("font"),
            fontSize = this.get("fontSize"),
            strokeWidth = this.get("strokeWidth"),
            radius = this.get("radius"),
            zIndex = this.get("zIndex");

        if (_.has(drawType, "text") && drawType.text === "Text schreiben") {
            style = this.getTextStyle(color, text, fontSize, font, 9999);
        }
        else if (_.has(drawType, "geometry") && drawType.geometry && drawType.text === "Kreis zeichnen" || drawType.text === "Doppelkreis zeichnen") {
            style = this.getCircleStyle(color, colorContour, strokeWidth, radius, zIndex);
        }
        else if (_.has(drawType, "geometry") && drawType.geometry) {
            style = this.getDrawStyle(color, colorContour, drawType.geometry, strokeWidth, radius, zIndex);
        }

        return style.clone();
    },

    /**
     * Creates a feature style for text and returns it
     * @param {number} color - of drawings
     * @param {string} text - of drawings
     * @param {number} fontSize - of drawings
     * @param {string} font - of drawings
     * @param {number} zIndex - zIndex of Element
     * @return {ol/style/Style} style
     */
    getTextStyle: function (color, text, fontSize, font, zIndex) {
        return new Style({
            text: new Text({
                textAlign: "left",
                text: text,
                font: fontSize + "px " + font,
                fill: new Fill({
                    color: color
                })
            }),
            zIndex: zIndex
        });
    },

    /**
     * Creates and returns a feature style for points, lines, or faces and returns it
     * @param {number} color - of drawings
     * @param {number} colorContour - color of the contours
     * @param {number} strokeWidth - from geometry
     * @param {number} zIndex - zIndex of Element
     * @return {ol/style/Style} style
     */
    getCircleStyle: function (color, colorContour, strokeWidth, zIndex) {
        return new Style({
            text: new Text({
                textAlign: "left",
                text: "     Set where the center of the circle should be.",
                font: "20px Arial",
                fill: new Fill({
                    color: "#000000"
                })
            }),
            image: new Circle({
                radius: 6,
                stroke: new Stroke({
                    color: colorContour,
                    width: strokeWidth
                }),
                fill: new Fill({
                    color: color
                })
            }),
            stroke: new Stroke({
                color: colorContour,
                width: strokeWidth
            }),
            fill: new Fill({
                color: color
            }),
            zIndex: zIndex
        });
    },

    /**
     * Creates and returns a feature style for points, lines, or polygon and returns it
     * @param {number} color - of drawings
     * @param {number} colorContour - color of the contours
     * @param {string} drawGeometryType - geometry type of drawings
     * @param {number} strokeWidth - from geometry
     * @param {number} radius - from geometry
     * @param {number} zIndex - zIndex of Element
     * @return {ol/style/Style} style
     */
    getDrawStyle: function (color, colorContour, drawGeometryType, strokeWidth, radius, zIndex) {
        return new Style({
            fill: new Fill({
                color: color
            }),
            stroke: new Stroke({
                color: colorContour,
                width: strokeWidth
            }),
            image: new Circle({
                radius: drawGeometryType === "Point" ? radius : 6,
                fill: new Fill({
                    color: drawGeometryType === "Point" ? color : colorContour
                })
            }),
            zIndex: zIndex
        });
    },

    /**
     * resets the module to its initial state
     * @return {void}
     */
    resetModule: function () {
        const defaultColor = this.defaults.color;

        defaultColor.pop();
        defaultColor.push(this.defaults.opacity);

        this.deactivateDrawInteraction();
        this.deactivateModifyInteraction();
        this.deactivateSelectInteraction();

        this.setRadius(this.defaults.radius);
        this.setCircleRadius(this.defaults.circleRadiusInner);
        this.setCircleRadiusOuter(this.defaults.circleRadiusOuter);
        this.setOpacity(this.defaults.opacity);
        this.setColor(defaultColor);
        this.setColorContour(defaultColor);

        this.setDrawType(this.defaults.drawType.geometry, this.defaults.drawType.text);
    },

    /**
     * creates and sets an interaction for selecting vector features
     * @param {ol/layer/Vector} layer - for the selected(deleted) features
     * @returns {void}
     */
    startSelectInteraction: function (layer) {
        var selectInteraction = this.createSelectInteraction(layer);

        this.createSelectInteractionListener(selectInteraction, layer);
        this.setSelectInteraction(selectInteraction);
    },

    /**
     * creates an interaction for selecting vector features
     * @param {ol/layer/Vector} layer - for the selected(deleted) features
     * @return {ol/interaction/Select} selectInteraction
     */
    createSelectInteraction: function (layer) {
        return new Select({
            layers: [layer]
        });
    },

    /**
     * craete an listener for select interaction
     * @param {ol/interaction/Select} selectInteraction - selectInteraction
     * @param {ol/layer/Vector} layer - for the selected(deleted) features
     * @return {void}
     */
    createSelectInteractionListener: function (selectInteraction, layer) {
        selectInteraction.on("select", function (evt) {
            // remove feature from source
            layer.getSource().removeFeature(evt.selected[0]);
            // remove feature from interaction
            this.getFeatures().clear();
        });
    },

    /**
     * creates and sets a interaction for modify vector features
     * @param {ol/layer/Vector} layer - for the selected(deleted) features
     * @returns {void}
     */
    createModifyInteraction: function (layer) {
        return new Modify({
            source: layer.getSource()
        });
    },

    /**
     * deletes all geometries from the layer
     * @return {void}
     */
    deleteFeatures: function () {
        this.get("layer").getSource().clear();
    },

    /**
     * toggle between modify, trash and draw modes
     * @param {string} mode - from active button
     * @return {void}
     */
    toggleInteraction: function (mode) {
        if (mode.indexOf("modify") !== -1) {
            this.deactivateDrawInteraction();
            this.activateModifyInteraction();
        }
        else if (mode.indexOf("trash") !== -1) {
            this.deactivateDrawInteraction();
            this.deactivateModifyInteraction();
            this.activateSelectInteraction();
        }
        else if (mode.indexOf("draw") !== -1) {
            this.deactivateModifyInteraction();
            this.deactivateSelectInteraction();
            this.activateDrawInteraction();
        }
    },

    /**
     * activate draw interaction
     * @return {void}
     */
    activateDrawInteraction: function () {
        if (!_.isUndefined(this.get("drawInteraction"))) {
            this.get("drawInteraction").setActive(true);
        }
    },

    /**
     * deactivates draw interaction
     * @return {void}
     */
    deactivateDrawInteraction: function () {
        if (!_.isUndefined(this.get("drawInteraction"))) {
            this.get("drawInteraction").setActive(false);
        }
    },

    /**
     * activate modify interaction
     * and change glyphicon to wrench
     * @return {void}
     */
    activateModifyInteraction: function () {
        if (!_.isUndefined(this.get("modifyInteraction"))) {
            this.get("modifyInteraction").setActive(true);
            this.putGlyphToCursor("glyphicon glyphicon-wrench");
        }
    },

    /**
     * deactivate modify interaction
     * and change glyphicon to pencil
     * @return {void}
     */
    deactivateModifyInteraction: function () {
        if (!_.isUndefined(this.get("modifyInteraction"))) {
            this.get("modifyInteraction").setActive(false);
            this.putGlyphToCursor("glyphicon glyphicon-pencil");
        }
    },

    /**
     * activate selct interaction
     * and change glyphicon to trash
     * @return {void}
     */
    activateSelectInteraction: function () {
        this.get("selectInteraction").setActive(true);
        this.putGlyphToCursor("glyphicon glyphicon-trash");
    },

    /**
     * deactivate selct interaction
     * and change glyphicon to pencil
     * @return {void}
     */
    deactivateSelectInteraction: function () {
        if (!_.isUndefined(this.get("selectInteraction"))) {
            this.get("selectInteraction").setActive(false);
            this.putGlyphToCursor("glyphicon glyphicon-pencil");
        }
    },

    /**
     * Creates an HTML element,
     * puts the glyph icon there and sticks it to the cursor
     * @param {string} glyphicon - of the mouse
     * @return {void}
     */
    putGlyphToCursor: function (glyphicon) {
        if (glyphicon.indexOf("trash") !== -1) {
            $("#map").removeClass("no-cursor");
            $("#map").addClass("cursor-crosshair");
        }
        else {
            $("#map").removeClass("cursor-crosshair");
            $("#map").addClass("no-cursor");
        }

        $("#cursorGlyph").removeClass();
        $("#cursorGlyph").addClass(glyphicon);
    },

    /**
     * Starts the download tool
     * @returns {void}
     */
    startDownloadTool: function () {
        const features = this.get("layer").getSource().getFeatures();

        Radio.trigger("Download", "start", {
            features: features,
            formats: ["KML", "GEOJSON", "GPX"]
        });
    },

    /**
     * activate the method "definiert", to define a circle by diameter.
     * @return {void}
     */
    enableMethodDefiniert: function () {
        $(".input-unit")[0].disabled = false;
        $(".diameter")[0].disabled = false;
    },

    /**
     * setter for drawType
     * @param {string} value1 - geometry
     * @param {string} value2 - text
     * @return {void}
     */
    setDrawType: function (value1, value2) {
        this.set("drawType", {geometry: value1, text: value2});
    },

    /**
     * setter for font
     * @param {string} value - font
     * @return {void}
     */
    setFont: function (value) {
        this.set("font", value);
    },

    /**
     * setter for fontSize
     * @param {number} value - fontSize
     * @return {void}
     */
    setFontSize: function (value) {
        this.set("fontSize", value);
    },

    /**
     * setter for color
     * @param {array} value - color
     * @return {void}
     */
    setColor: function (value) {
        this.set("color", value);
    },

    /**
     * setter for color
     * @param {array} value - color
     * @return {void}
     */
    setColorContour: function (value) {
        this.set("colorContour", value);
    },

    /**
     * setter for opacity
     * @param {number} value - opacity
     * @return {void}
     */
    setOpacity: function (value) {
        this.set("opacity", value);
    },

    /**
     * setter for text
     * @param {string} value - text
     * @return {void}
     */
    setText: function (value) {
        this.set("text", value);
    },

    /**
     * setter for radius
     * @param {number} value - radius
     * @return {void}
     */
    setRadius: function (value) {
        this.set("radius", parseInt(value, 10));
    },

    /**
     * setter for radius
     * @param {number} value - radius
     * @return {void}
     */
    setCircleRadius: function (value) {
        const selectedUnit = this.get("unit");
        let valueRadius = value;

        if (selectedUnit === "km") {
            valueRadius = valueRadius * 1000;
        }

        this.set("circleRadiusInner", parseFloat(valueRadius));
    },

    /**
     * setter for outer radius
     * @param {number} value - radius
     * @return {void}
     */
    setCircleRadiusOuter: function (value) {
        const selectedUnit = this.get("unit");
        let valueRadius = value;

        if (selectedUnit === "km") {
            valueRadius = valueRadius * 1000;
        }

        this.set("circleRadiusOuter", parseFloat(valueRadius));
    },

    setDoubleCircle: function (value) {
        this.set("Doppelkreis", value);
    },

    /**
     * Setter for unit
     * @param {string} value - m/km
     * @returns {void}
     */
    setUnit: function (value) {
        this.set("unit", value);
    },

    /**
     * Setter for the method to draw a circle.
     * @param {string} value - interaktiv or definiert
     * @returns {void}
     */
    setMethodCircle: function (value) {
        this.set("methodCircle", value);
    },

    /**
     * setter for strokeWidth
     * @param {number} value - strokeWidth
     * @return {void}
     */
    setStrokeWidth: function (value) {
        this.set("strokeWidth", parseInt(value, 10));
    },

    /**
     * setter for layer
     * @param {ol/layer/Vector} value - layer
     * @return {void}
     */
    setLayer: function (value) {
        this.set("layer", value);
    },

    /**
     * setter for selectInteraction
     * @param {ol/interaction/select} value - selectInteraction
     * @return {void}
     */
    setSelectInteraction: function (value) {
        this.set("selectInteraction", value);
    },

    /**
     * setter for drawInteraction
     * @param {ol/interaction/Draw} value - drawInteraction
     * @return {void}
     */
    setDrawInteraction: function (value) {
        this.set("drawInteraction", value);
    },

    /**
     * setter for modifyInteraction
     * @param {ol/interaction/modify} value - modifyInteraction
     * @return {void}
     */
    setModifyInteraction: function (value) {
        this.set("modifyInteraction", value);
    },

    /**
     * setter for addFeatureListener
     * @param {object} value - addFeatureListener
     * @return {void}
     */
    setAddFeatureListener: function (value) {
        this.set("addFeatureListener", value);
    },

    /*
    * count up zIndex
    * @returns {void}
    */
    countupZIndex: function () {
        var value = this.get("zIndex") + 1;

        this.setZIndex(value);
    },

    /*
    * setter for zIndex
    * @param {number} value zIndex
    * @returns {void}
    */
    setZIndex: function (value) {
        this.set("zIndex", value);
    }
});

export default DrawTool;
