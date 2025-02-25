import axios from "axios";
import store from "../../../../../../app-store";
import {expect} from "chai";
import sinon from "sinon";
import {RoutingGeosearchResult} from "../../../../js/classes/routing-geosearch-result";
import {fetchRoutingElasticGeosearch} from "../../../../js/geosearch/routing-elastic-geosearch";

describe("src/modules/routing/js/geosearch/routing-locationFinder-elastic.js", () => {
    let service;

    beforeEach(() => {
        service = "https://service";
        sinon.stub(i18next, "t").callsFake((...args) => args);
        store.getters = {
            restServiceById: () => ({url: service})
        };
        store.state.Modules.Routing.geosearch.epsg = "25832";
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("should fetchRoutingElasticGeosearch", () => {
        it("should process result correct", async () => {
            sinon.stub(axios, "get").returns(
                new Promise((resolve) => resolve({
                    status: 200,
                    data: {
                        hits: {
                            hits: [
                                {
                                    _index: "nuernberg",
                                    _type: "_doc",
                                    _id: "1209",
                                    _score: null,
                                    _source: {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates: [648919.1061000004, 5482432.313200001]
                                        },
                                        properties: {
                                            indexname: "StraÃŸe",
                                            sort: 2,
                                            hitGlyphicon: "bi-signpost-2-fill",
                                            searchField: "Kieler StraÃŸe",
                                            HAUSNUMMER: 0,
                                            PLZ: 90425,
                                            id: "f54e7912-221a-440a-a1d5-ac712c2f153d",
                                            coordinates: "648919.1061000004 5482432.313200001",
                                            type: "POINT"
                                        }
                                    },
                                    sort: [0]
                                },
                                {
                                    _index: "nuernberg",
                                    _type: "_doc",
                                    _id: "13922",
                                    _score: null,
                                    _source: {
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates: [648892.3567000004, 5482333.2038]
                                        },
                                        properties: {
                                            indexname: "Adresse",
                                            sort: 3,
                                            hitGlyphicon: "bi-signpost-2-fill",
                                            searchField: "Kieler StraÃŸe 1",
                                            HAUSNUMMER: 1,
                                            PLZ: 90425,
                                            id: "691f726f-693e-4a4d-8b22-61092df9da3a",
                                            coordinates: "648892.3567000004 5482333.2038",
                                            type: "POINT"
                                        }
                                    },
                                    sort: [1]
                                }
                            ]
                        }
                    }
                })
                ));

            const result = await fetchRoutingElasticGeosearch(
                    "testsearch"
                ),
                expectedResult = [new RoutingGeosearchResult(
                    [648919.1061000004, 5482432.313200001],
                    "Kieler StraÃŸe",
                    "25832"
                ),
                new RoutingGeosearchResult(
                    [648892.3567000004, 5482333.2038],
                    "Kieler StraÃŸe 1",
                    "25832"
                )
                ];

            expect(result).deep.to.eql(expectedResult);
        });

        it("should throw error with status", async () => {
            sinon.stub(axios, "get").returns(
                new Promise((_, reject) => reject({
                    status: 999,
                    message: "testerror"
                })
                )
            );

            try {
                await fetchRoutingElasticGeosearch("testsearch");
                // should not reach here
                expect(true).to.be.false;
            }
            catch (error) {
                expect(error.message).equal("testerror");
            }
        });
    });
});
