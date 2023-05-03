/**
 * Contains actions that communicate with the search interfaces.
 */
import SearchInterfaceGazetteer from "../../searchInterfaces/searchInterfaceGazetteer";

export default {
    /**
     * Instantiate the configured search interfaces
     * and stores them in the state.
     * @param {Object} param.commit the commit
     * @param {Object} param.state the state
     * @returns {void}
     */
    instantiateSearchInterfaces: ({commit, state}) => {
        const searchInterfacesMapper = {
            gazetteer: SearchInterfaceGazetteer
        };

        Object.keys(state.searchInterfaces).forEach(searchInterface => {
            commit("addSearchInterfaceInstances", new searchInterfacesMapper[searchInterface](state.searchInterfaces[searchInterface]));
        });
    },

    /**
     * Send search input to configured searchInterfaces
     * and push the response objects to the state attribute "searchResults".
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @param {Object} payload The payload.
     * @param {Object} payload.searchInput The search input.
     * @param {Object} [payload.searchType="result"] The search type "suggestion" or "result".
     * @returns {void}
     */
    search: ({commit, dispatch, state}, {searchInput, searchType = "result"}) => {
        dispatch("cleanSearchHits");
        state.searchInterfaceInstances.forEach(instance => {
            instance.search(searchInput, searchType)
                .then(searchHits => {
                    commit("addSearchHits", {searchHits, searchType});
                })
                .catch(error => {
                    if (String(error) !== "AbortError: The user aborted a request.") {
                        console.error(error);
                    }
                });
        });
    },

    /**
     * Clean the search suggestions and search results.
     * @param {Object} param.commit the commit
     * @returns {void}
     */
    cleanSearchHits: ({commit}) => {
        commit("setSearchSuggestions", []);
        commit("setSearchResults", []);
    }
};
