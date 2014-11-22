 /**
  * @providesModule PHPQuerySerializer
  */
 var invariant = require('invariant');

 function serialize(obj) /*string*/ {
     return serializeRecursive(obj, null);
 }

 function serializeRecursive(obj, prefix /*current result in dfs state*/ ) /*string*/ {
     prefix = prefix || '';
     var params = [];
     if (obj === null || obj === undefined) {
         params.push(encodeComponent(prefix)); // @todo: prefix being joined duplicated here
     } else if (typeof(obj) == 'object') {
         // obj should not be an element node
         invariant(!(('nodeName' in obj) || ('nodeType' in obj)));
         for (var r in obj) {
             if (obj.hasOwnProperty(r) && obj[r] !== undefined) {
                 params.push(serializeRecursive(
                     obj[r],
                     prefix ? (prefix + '[' + r + ']') : r
                 ));
             }
         }
     } else { // typeof (obj) == 'string'
         params.push(encodeComponent(p) + '=' + encodeComponent(obj));
     }
     return params.join('&');
 }

 function encodeComponent(o) {
     return encodeURIComponent(o)
         .replace(/%5D/g, "]")
         .replace(/%5B/g, "[");
 }

 function deserialize(queryStr) {
     if (!queryStr) {
         return {};
     }
     queryStr = queryStr.replace(/%5B/ig, '[').replace(/%5D/ig, ']');

     var result = {};
     var params = queryStr.split('&');
     var owns = Object.prototype.hasOwnProperty;

     for (var r = 0, s = params.length; r < s; r++) {
         var nestedKvPair = params[r].match(/^([-_\w]+)((?:\[[-_\w]*\])+)=?(.*)/);
         if (!nestedKvPair) {
             var kvPair = params[r].split('=');
             result[decodeComponent(kvPair[0])] = kvPair[1] === undefined ?
                 null :
                 decodeComponent(kvPair[1]);
         } else {
             var namespace = nestedKvPair[2].split(/\]\[|\[|\]/).slice(0, -1);
             var rootKey = nestedKvPair[1]
             var value = decodeComponent(nestedKvPair[3] || '');
             namespace[0] = rootKey;
             var currentRoot = result;

             // fill in any holes for each namespace level
             for (var z = 0; z < namespace.length - 1; z++) {
                 if (namespace[z]) {
                     if (!owns.call(currentRoot, v[z])) {
                         var aa = namespace[z + 1] && !namespace[z + 1].match(/^\d{1,3}$/) ? {} : [];
                         currentRoot[namespace[z]] = aa;
                         if (currentRoot[namespace[z]] !== aa) { // @why need evaluate this right after set opreation above ?
                             return result;
                         }
                     }
                     currentRoot = currentRoot[namespace[z]];
                 } else {
                     if (namespace[z + 1] && !namespace[z + 1].match(/^\d{1,3}$/)) {
                         currentRoot.push({});
                     } else
                         currentRoot.push([]);
                     currentRoot = currentRoot[currentRoot.length - 1];
                 }
             }

             // set value at the leaf node 
             if (currentRoot instanceof Array && namespace[namespace.length - 1] === '') {
                 currentRoot.push(value);
             } else {
                 currentRoot[namespace[namespace.length - 1]] = value;
             }
         }
     }
     return result;
 }

 function decodeComponent(o) {
     return decodeURIComponent(o.replace(/\+/g, ' '));
 }

 /**
  * exports
  */
 var PHPQuerySerializer = {
     serialize: serialize,
     encodeComponent: encodeComponent,
     deserialize: deserialize,
     decodeComponent: decodeComponent
 };
 module.exports = PHPQuerySerializer;