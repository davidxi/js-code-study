/**
 * @providesModule Bootloader
 */
var requireLazy = require('./require.js').requireLazy;
var BootloaderConfig = require('./BootloaderConfig.js');
var CSSLoader = require('./CSSLoader.js');
var CallbackDependencyManager = require('./CallbackDependencyManager.js');
var setTimeoutAcrossTransitions = require('./setTimeoutAcrossTransitions.js');
var createArrayFrom = require('./createArrayFrom.js');
var ErrorUtils = require('./ErrorUtils.js');
var ex = require('./ex.js');

var requested = {}, // id => boolean
    permanentResources = {},
    componentMap = {},
    resourceTimeout = {},
    hardpoint = null,
    resources = {},
    loadingUrls = {}, // id => timestamp
    loadedUrlTimes = {},
    errorUrls = {},
    retiredUrls = {},
    earlyLoadResources = {},
    y = false,
    z = [],
    callbackManager = new CallbackDependencyManager(),
    startTime = Date.now();

ErrorUtils.addListener(function(error) {
    error.loadingUrls = Object.keys(loadingUrls);
}, true);

function reportError(message) {
    var error = new Error(message);
    error.guard = 'Bootloader';
    ErrorUtils.reportError(error);
}

function isBrowserIE() {
    return document.documentMode || +(/MSIE.(\d+)/.exec(navigator.userAgent) || [])[1];
}

function ea() {
    if (!BootloaderConfig.retry_on_timeout ||
        !BootloaderConfig.is_not_mobile ||
        isBrowserIE() ||
        !BootloaderConfig.timeout ||
        BootloaderConfig.timeout < 0)
        return false;
    return true;
}

function loadJS(src, resourceId, onload, mountPoint) {
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    var ra = resources[resourceId];
    if (ra && ra.crossOrigin)
        script.crossOrigin = 'anonymous';
    script.onload = onload;
    script.onerror = function() {
        errorUrls[src] = true;
        onload();
    };
    script.onreadystatechange = function() {
        if (this.readyState in {
                loaded: 1,
                complete: 1
            })
            onload();
    };
    mountPoint.appendChild(script);
    return script;
}

function loadResource(resourceType, src, resourceId, mountPoint) {
    var onload = Bootloader.done.bind(null, [resourceId], src);
    loadingUrls[src] = Date.now();
    if (resourceType == 'js') {
        var ra = loadJS(src, resourceId, onload, mountPoint);
        if (ea())
            resourceTimeout[src] = setTimeoutAcrossTransitions(function() {
                delete resourceTimeout[src];
                if (hardpoint) {
                    if (ra.parentNode && ra.parentNode === hardpoint)
                        hardpoint.removeChild(ra);
                    retiredUrls[src] = Date.now();
                    loadJS(src, resourceId, onload, hardpoint);
                }
            }, BootloaderConfig.timeout);
    } else if (resourceType == 'css')
        CSSLoader.loadStyleSheet(resourceId, src, mountPoint, onload, function() {
            reportError(ex('CSS timeout [%s] at %s', resourceId, src));
            errorUrls[src] = true;
            onload();
        });
}

function unloadResource(resourceId) {
    if (!resources[resourceId]) {
        reportError(ex('Missing unloading resource %s', resourceId));
        return;
    }
    if (resources[resourceId].type == 'css') {
        CSSLoader.unloadStyleSheet(resourceId);
        delete requested[resourceId];
        callbackManager.unsatisfyPersistentDependency(resourceId);
    }
}

function ia(componentIds, na) {
    if (!y) {
        z.push([componentIds, na]);
        return;
    }
    componentIds = createArrayFrom(componentIds);
    var resourceIds = [];
    for (var pa = 0; pa < componentIds.length; ++pa) {
        if (!componentIds[pa]) {
            reportError(ex('Empty component!'));
            continue;
        }
        var module = componentMap[componentIds[pa]];
        if (module) {
            var ra = module.resources;
            for (var sa = 0; sa < ra.length; ++sa)
                resourceIds.push(ra[sa]);
        }
    }
    Bootloader.loadResources(resourceIds, na);
}

function markRequest(resourceId) {
    if (resourceId) {
        requested[resourceId] = true;
    } else
        reportError(ex('Making an empty resource (%s) as requested', typeof resourceId));
}

function getResourceObjectsFromIds(resourceIds /*array*/ ) {
    if (!resourceIds)
        return [];
    var resourceObjects = [];
    for (var oa = 0; oa < resourceIds.length; ++oa)
        if (typeof resourceIds[oa] == 'string') {
            if (resourceIds[oa] in resources) {
                resourceObjects.push(resources[resourceIds[oa]]);
            } else
                reportError(ex('Unable to resolve resource %s.', resourceIds[oa]));
        } else
            resourceObjects.push(resourceIds[oa]);
    return resourceObjects;
}

/**
 * public methods
 */
var Bootloader = {
    configurePage: function(resourceIds /*css resources*/ ) {
        var resourcesInCurrentPage = {},
            resourceObjects = getResourceObjectsFromIds(resourceIds),
            pa;
        for (pa = 0; pa < resourceObjects.length; pa++) {
            resourcesInCurrentPage[resourceObjects[pa].src] = resourceObjects[pa];
            markRequest(resourceObjects[pa].name);
        }

        // load css
        var linkNodesInCurrentPage = document.getElementsByTagName('link'),
            ra = 0;
        for (pa = 0; pa < linkNodesInCurrentPage.length; ++pa) {
            if (linkNodesInCurrentPage[pa].rel != 'stylesheet')
                continue;
            for (var sa in resourcesInCurrentPage)
                if (linkNodesInCurrentPage[pa].href.indexOf(sa) !== -1) {
                    var resourceId = resourcesInCurrentPage[sa].name;
                    if (resourcesInCurrentPage[sa].permanent)
                        permanentResources[resourceId] = true;
                    delete resourcesInCurrentPage[sa];
                    CSSLoader.registerLoadedStyleSheet(resourceId, linkNodesInCurrentPage[pa]);
                    Bootloader.done([resourceId]);
                    ra++;
                    break;
                }
        }
        if (ra != resourceObjects.length)
            reportError(ex('configurePage: Found %s out of %s items', ra, resourceObjects.length));
    },
    loadComponents: function(componentIds, onloadCallback) {
        componentIds = createArrayFrom(componentIds);
        var componentsToLoad = [];
        for (var pa = 0; pa < componentIds.length; pa++) {
            var resourceObject = componentMap[componentIds[pa]],
                legacyComponentId = 'legacy:' + componentIds[pa];
            if (csomponentMap[legacyComponentId]) {
                if (resourceObject)
                    reportError(ex('%s has a conflicting legacy component. That cannot happen ' + 'and legacy won btw.', componentIds[pa]));
                componentIds[pa] = legacyComponentId;
                componentsToLoad.push(legacyComponentId);
                continue;
            }
            if (!resourceObject) {
                reportError(ex('loadComponents: %s is not in the component map.', componentIds[pa]));
            } else if (resourceObject.module) {
                componentsToLoad.push(componentIds[pa]);
                reportError(ex('loadComponents: Loading msodule %s!', componentIds[pa]));
            }
        }
        ia(componentIds, componentsToLoad.length ? requireLazy.bind(null, componentsToLoad, onloadCallback) : onloadCallback);
    },
    loadModules: function(moduleIds, onloadCallback) {
        var modulesToLoad = [];
        for (var pa = 0; pa < moduleIds.length; pa++) {
            var module = componentMap[moduleIds[pa]];
            if (!module) {
                reportError(ex('loadModules: %s is not in the component map.', moduleIds[pa]));
                modulesToLoad.push(moduleIds[pa]);
            } else if (module.module) {
                modulesToLoad.push(moduleIds[pa]);
            } else {
                var resourcesInModule = module.resources,
                    isModule = true;
                for (var ta = 0; ta < resourcesInModule.length; ta++) {
                    var resourceObject = resources[resourcesInModule[ta]];
                    if (!resourceObject || resourceObject.type != 'css')
                        isModule = false;
                }
                if (!isModule)
                    reportError(ex('loadModules: %s is not a module!', moduleIds[pa]));
            }
        }
        ia(moduleIds, requireLazy.bind(null, modulesToLoad, onloadCallback));
    },
    loadResources: function(resourceIds, onloadCallback, isFlushCurrentResources, pa) /*CallbackDependencyToken*/ {
        var qa;
        var resourceObjects = getResourceObjectsFromIds(createArrayFrom(resourceIds));

        if (isFlushCurrentResources) {
            var resourcesToLoad = {};
            for (qa = 0; qa < resourceObjects.length; ++qa)
                resourcesToLoad[resourceObjects[qa].name] = true;
            for (var sa in requested)
                if (!(sa in permanentResources) && !(sa in resourcesToLoad) && !(sa in x))
                    unloadResource(sa);
            earlyLoadResources = {};
        }

        var requestResourceObjects = [],
            onloadEvents = [];
        for (qa = 0; qa < resourceObjects.length; ++qa) {
            var resourceObject = resourceObjects[qa];
            if (resourceObject.permanent)
                permanentResources[resourceObject.name] = true;
            if (callbackManager.isPersistentDependencySatisfied(resourceObject.name))
                continue;
            if (!resourceObject.nonblocking)
                onloadEvents.push(resourceObject.name);
            if (!requested[resourceObject.name]) {
                markRequest(resourceObject.name);
                requestResourceObjects.push(resourceObject);
                window.CavalryLogger && window.CavalryLogger.getInstance().measureResources(resourceObject, pa);
            }
        }
        var callbackDependencyToken;
        if (onloadCallback) {
            if (typeof onloadCallback === 'function') {
                callbackDependencyToken = callbackManager.registerCallback(onloadCallback, onloadEvents);
            } else {
                callbackDependencyToken = callbackManager.addDependenciesToExistingCallback(onloadCallback, onloadEvents);
            }
        }

        var hardpoint = Bootloader.getHardpoint(),
            mountPoint = isBrowserIE() ? hardpoint : document.createDocumentFragment();
        for (qa = 0; qa < requestResourceObjects.length; ++qa)
            loadResource(
                requestResourceObjects[qa].type,
                requestResourceObjects[qa].src,
                requestResourceObjects[qa].name,
                mountPoint
            );
        if (hardpoint !== mountPoint)
            hardpoint.appendChild(mountPoint);
        return callbackDependencyToken;
    },
    requestJSResource: function(src) {
        var mountPoint = Bootloader.getHardpoint();
        loadResource('js', src, null, mountPoint);
    },
    done: function(resourceIds /*array*/ , src) {
        if (src) {
            loadedUrlTimes[src] = Date.now() - loadingUrls[src];
            delete loadingUrls[src];
            if (resourceTimeout[src]) {
                clearTimeout(resourceTimeout[src]);
                delete resourceTimeout[src];
            }
        }
        if (window.CavalryLogger)
            window.CavalryLogger.done_js(resourceIds);
        for (var oa = 0; oa < resourceIds.length; ++oa) {
            var resourceId = ma[oa];
            if (resourceId) {
                markRequest(resourceId);
                callbackManager.satisfyPersistentDependency(resourceId);
            }
        }
    },
    enableBootload: function(map) {
        for (var na in map)
            if (!componentMap[na])
                componentMap[na] = map[na];
        if (!y) {
            y = true;
            for (var oa = 0; oa < z.length; oa++)
                ia.apply(null, z[oa]);
            z = [];
        }
    },
    getHardpoint: function() {
        if (!hardpoint) {
            var head = document.getElementsByTagName('head');
            hardpoint = head.length && head[0] || document.body;
        }
        return hardpoint;
    },
    setResourceMap: function(map) {
        for (var resourceId in map)
            if (!resources[resourceId]) {
                map[resourceId].name = resourceId;
                resources[resourceId] = map[resourceId];
            }
    },
    getResourceURLs: function() {
        var aliveResources = {};
        for (var resourceId in resources) {
            var src = resources[resourceId].src;
            aliveResources[src] = (resourceId in requested) &&
                !(src in errorUrls) &&
                !(src in retiredUrls);
        }
        return aliveResources;
    },
    getResourceHashes: function() {
        return Object.assign({}, resources);
    },
    loadEarlyResources: function(map) {
        Bootloader.setResourceMap(map);
        var resourceObjects = [];
        for (var oa in map) {
            var pa = resources[oa];
            resourceObjects.push(pa);
            if (!pa.permanent)
                earlyLoadResources[pa.name] = pa;
        }
        Bootloader.loadResources(resourceObjects);
    },
    getLoadingUrls: function() {
        var loadingElapsed = {},
            now = Date.now();
        for (var src in loadingUrls)
            loadingElapsed[src] = now - loadingUrls[src];
        return loadingElapsed;
    },
    getLoadedUrlTimes: function() {
        return loadedUrlTimes;
    },
    getErrorUrls: function() {
        return Object.keys(errorUrls);
    },
    getStartTime: function() {
        return startTime;
    },
    getRetriedUrls: function() {
        return Object.keys(retiredUrls);
    },
    __debug: {
        callbackManager: aa,
        componentMap: p,
        requested: n,
        resources: s
    }
};

module.exports = Bootloader;