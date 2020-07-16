/**
 * Retrieves a value from an object by dot or array syntax, like this:
 *  - const ex = {drinks: {milk: {fresh: "tasty"}}};
 *  - getByDotSyntax(ex, "drinks.milk.fresh") === "tasty"
 *  - getByDotSyntax(ex, ["drinks", "milk", "fresh"]) === "tasty"
 *  - getByDotSyntax(ex, ["drinks", "milk.fresh"]) === "tasty"
 *  - getByDotSyntax(ex, ["drinks", ["milk", "fresh"]]) === "tasty"
 *  - getByDotSyntax(ex, ["drinks", ["milk.fresh"]]) === "tasty"
 *
 * @Todo Needs to be a helper, should not be here
 * @param {object} obj - The object to search in
 * @param {array|string} path - Array or String with the key.
 * @param {string} separator - Charactor to separate multiple keys
 * @returns {mixed} Retrieved value or undefined, if nothing found
 */
function getByDotSyntax (obj, path, separator = ".") {
    const pathArray = createKeyPathArray(path);

    if (pathArray === false) {
        console.warn("Invalid path parameter given for \"getByDotSyntax()\":", path);
        return undefined;
    }

    return getByArraySyntax(obj, pathArray, separator);
}
export {getByDotSyntax};

/**
 * Retrieves a value from an object by array syntax, like this:
 *  - const ex = {drinks: {milk: {fresh: "tasty"}}};
 *  - getByArraySyntax(ex, ["drinks", "milk", "fresh"]) === "tasty"
 *
 * @param {object} obj - The object to search in
 * @param {array} pathArray - Array with path keys
 * @returns {mixed} Retrieved value or undefined, if nothing found
 */
function getByArraySyntax (obj, pathArray) {
    const step = pathArray.shift();

    if (obj instanceof Object === false || obj[step] === undefined) {
        return undefined;
    }

    if (pathArray.length === 0) {
        return obj[step];
    }

    return getByArraySyntax(obj[step], pathArray);
}

/**
 * Creates flat array of strings out of a variety of possible path arrays or strings.
 *  - createKeyPathArray("drinks.milk.fresh")
 *  - createKeyPathArray(["drinks", "milk", "fresh"])
 *  - createKeyPathArray(["drinks", "milk.fresh"])
 *  - createKeyPathArray(["drinks", ["milk", "fresh"]])
 *  - createKeyPathArray(["drinks", ["milk.fresh"]])
 * all return ["drinks", "milk, "fresh"]
 *
 * If Arrays dont contain Strings or Arrays, it returns false.
 * If Strings start or end with the separator, it returns false.
 *
 * @param {array|string} path - Array or String with the key path.
 * @param {string} separator - Charactor to separate multiple keys
 * @returns {array|boolean} Array of path strings or false
 */
function createKeyPathArray (path, separator = ".") {
    let result = [];

    if (typeof path === "string") {
        result = path.split(separator);

        for (const pathPart1 of result) {
            if (pathPart1 === "") {
                return false;
            }
        }

        return result;
    }
    else if (!Array.isArray(path)) {
        return false;
    }

    for (const pathPart2 of path) {
        const resultRec = createKeyPathArray(pathPart2, separator);

        if (resultRec === false) {
            return false;
        }

        result = [...result, ...resultRec];
    }

    return result;
}

/**
 * Deep merges module config objects into the module's state.
 * Module configs must be objects.
 * Module must have default values for those properties.
 *
 * @param {object} context - The store's context
 * @param {array} configPaths - Array of paths to search for in root state
 * @param {string} moduleName - Name of the module
 * @param {boolean} [recursiveFallback=true] - (optional) determines whether the fallbackOption is executed
 * @returns {boolean} True, if successfully merged
 */
function fetchFirstModuleConfig (context, configPaths, moduleName, recursiveFallback = true) {
    const missingSources = [],
        missingDefaultValues = [],
        // no real config-params, e.g. added during parsing: must not be in state as default
        defaultsNotInState = ["i18nextTranslate", "useConfigName"];

    let source,
        success = false;

    for (const path of configPaths) {
        source = getByDotSyntax(context.rootState, path);

        if (source === undefined) {
            missingSources.push(createKeyPathArray(path));
            continue;
        }

        // Config Source must be an object in order to set those into the module state
        if (source instanceof Object === false || Array.isArray(source)) {
            console.error("Config für \"" + moduleName + "\" wurde ignoriert, da sie kein Object ist.", source);
            console.warn("Pfad der fehlerhaften Config:", createKeyPathArray(path));
            continue;
        }

        // Check for missing default values in module state
        for (const sourceProp in source) {
            if (!defaultsNotInState.includes(sourceProp) && context.state[sourceProp] === undefined) {
                missingDefaultValues.push(sourceProp);
            }
        }
        if (missingDefaultValues.length > 0) {
            console.warn("Im Modul \"" + moduleName + "\" wurden folgende Standardwerte nicht gefunden. Diese werden aus der Config übernommen, haben möglicherweise aber keinen Effekt.", missingDefaultValues);
            console.warn("Pfad des Moduls:", createKeyPathArray(path));
        }

        // only use the first found config
        break;
    }

    if (missingSources.length > 0) {
        console.warn("Config für \"" + moduleName + "\" wurde an folgenden Orten nicht gefunden.", missingSources);
    }

    if (!source && recursiveFallback) {
        console.warn("Config für \"" + moduleName + "\" konnte an keinem der angegebenen Pfade gefunden werden. Es wird versucht die PortalConfig automatisch zu durchsuchen.");
        source = context.rootGetters.toolConfig(moduleName);
    }

    if (source) {
        context.state = deepMerge(source, context.state);
        success = true;
    }

    if (!success) {
        console.warn("Config für \"" + moduleName + "\" wurde nicht geladen.");
    }

    return success;
}
export {fetchFirstModuleConfig};

/**
 * Deep merges one object into another. If given source param is no object or an Array, nothing happens.
 * @param {object} source - Source object to merge into target object
 * @param {object} target - Target object that will be modified
 * @returns {object} - The resulting merged object
 */
function deepMerge (source, target) {
    if (source instanceof Object === false || Array.isArray(source)) {
        return target;
    }

    if (target instanceof Object === false) {
        return {...source};
    }

    for (const key in source) {
        if (source[key] instanceof Object === false) {
            target[key] = source[key];
        }
        else {
            target[key] = deepMerge(source[key], target[key]);
        }
    }

    return target;
}
export {deepMerge};

