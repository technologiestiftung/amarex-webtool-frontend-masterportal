import {expect} from "chai";

import mutations from "../../../store/mutationsLayerSelection";

const {clearLayerSelection, addSelectedLayer, removeSelectedLayer, reduceToPreviousLayerSelection, addToLayerSelection} = mutations;

describe("src_3_0_0/modules/layerTree/layerSelection/store/mutationsLayerSelection", function () {
    describe("clearLayerSelection", function () {
        it("Clears layerSelection", function () {
            const state = {
                layersToAdd: ["1", "2"],
                lastFolderNames: ["1", "2"],
                lastSubjectDataLayerConfs: [{id: "1"}, {id: "2"}],
                lastBackgroundLayerConfs: [{id: "1"}, {id: "2"}]
            };

            clearLayerSelection(state);
            expect(state.layersToAdd).to.be.deep.equals([]);
            expect(state.lastFolderNames).to.be.deep.equals([]);
            expect(state.lastSubjectDataLayerConfs).to.be.deep.equals([]);
            expect(state.lastBackgroundLayerConfs).to.be.deep.equals([]);
        });
    });

    describe("addSelectedLayer", function () {
        it("add layer id to layersToAdd", function () {
            const state = {
                layersToAdd: ["1", "2"]
            };

            addSelectedLayer(state, {layerId: "3"});
            expect(state.layersToAdd.length).to.be.equals(3);
            expect(state.layersToAdd[2]).to.be.equals("3");
            addSelectedLayer(state, {layerId: "4"});
            expect(state.layersToAdd.length).to.be.equals(4);
            expect(state.layersToAdd[3]).to.be.equals("4");
        });
    });

    describe("removeSelectedLayer", function () {
        it("removes layer id from layersToAdd", function () {
            const state = {
                layersToAdd: ["1", "2"]
            };

            removeSelectedLayer(state, {layerId: "3"});
            expect(state.layersToAdd.length).to.be.equals(2);
            removeSelectedLayer(state, {layerId: "2"});
            expect(state.layersToAdd.length).to.be.equals(1);
            expect(state.layersToAdd[0]).to.be.equals("1");
        });
    });

    describe("reduceToPreviousLayerSelection", function () {
        it("does not fail if navigation arrays are empty", function () {
            const state = {
                lastFolderNames: [],
                lastSubjectDataLayerConfs: [],
                lastBackgroundLayerConfs: []
            };

            reduceToPreviousLayerSelection(state);
            expect(state.lastFolderNames.length).to.be.equals(0);
            expect(state.lastSubjectDataLayerConfs.length).to.be.equals(0);
            expect(state.lastBackgroundLayerConfs.length).to.be.equals(0);
        });

        it("removes last entry from navigation arrays", function () {
            const state = {
                lastFolderNames: ["1", "2"],
                lastSubjectDataLayerConfs: [{id: "1"}, {id: "2"}],
                lastBackgroundLayerConfs: [{id: "bg1"}, {id: "bg2"}]
            };

            reduceToPreviousLayerSelection(state);
            expect(state.lastFolderNames.length).to.be.equals(1);
            expect(state.lastFolderNames[0]).to.be.equals("1");
            expect(state.lastSubjectDataLayerConfs.length).to.be.equals(1);
            expect(state.lastSubjectDataLayerConfs[0]).to.be.deep.equals({id: "1"});
            expect(state.lastBackgroundLayerConfs.length).to.be.equals(1);
            expect(state.lastBackgroundLayerConfs[0]).to.be.deep.equals({id: "bg1"});
        });
    });

    describe("addToLayerSelection", function () {
        it("addToLayerSelection", function () {
            const state = {
                    lastFolderNames: [],
                    lastSubjectDataLayerConfs: [],
                    lastBackgroundLayerConfs: []
                },
                lastFolderName = "lastFolderName",
                subjectDataLayerConfs = [{id: "1"}, {id: "2"}],
                backgroundLayerConfs = [{id: "bg1"}, {id: "bg2"}];

            addToLayerSelection(state, {lastFolderName, subjectDataLayerConfs, backgroundLayerConfs});
            expect(state.lastFolderNames.length).to.be.equals(1);
            expect(state.lastFolderNames[0]).to.be.equals(lastFolderName);
            expect(state.lastSubjectDataLayerConfs.length).to.be.equals(1);
            expect(state.lastSubjectDataLayerConfs[0]).to.be.deep.equals(subjectDataLayerConfs);
            expect(state.lastBackgroundLayerConfs.length).to.be.equals(1);
            expect(state.lastBackgroundLayerConfs[0]).to.be.deep.equals(backgroundLayerConfs);
        });
    });


});
