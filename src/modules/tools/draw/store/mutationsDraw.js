import {generateSimpleMutations} from "../../../../app-store/utils/generators";
import initialState from "./stateDraw";

const mutations = {
    ...generateSimpleMutations(initialState),
    setDownloadBlob: (state, payload) => {
        state.download.blob = payload;
    },
    setDownloadDataString: (state, payload) => {
        state.download.dataString = payload;
    },
    setDownloadDisabled: (state, payload) => {
        state.download.disabled = payload;
    },
    setDownloadFeatures: (state, payload) => {
        state.download.features = payload;
    },
    setDownloadFileName: (state, payload) => {
        state.download.fileName = payload;
    },
    setDownloadFileUrl: (state, payload) => {
        state.download.fileUrl = payload;
    },
    setDownloadSelectedFormat: (state, payload) => {
        state.download.selectedFormat = payload;
    }
};

export default mutations;
