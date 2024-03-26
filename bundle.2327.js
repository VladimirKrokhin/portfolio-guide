(self["webpackChunkace_playground"] = self["webpackChunkace_playground"] || []).push([[2327,3871],{

/***/ 72327:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


exports.snippetText = __webpack_require__(53871);
exports.scope = "velocity";
exports.includeScopes = ["html", "javascript", "css"];


/***/ }),

/***/ 53871:
/***/ ((module) => {

module.exports = `# macro
snippet #macro
	#macro ( \${1:macroName} \${2:\\\$var1, [\\\$var2, ...]} )
		\${3:## macro code}
	#end
# foreach
snippet #foreach
	#foreach ( \${1:\\\$item} in \${2:\\\$collection} )
		\${3:## foreach code}
	#end
# if
snippet #if
	#if ( \${1:true} )
		\${0}
	#end
# if ... else
snippet #ife
	#if ( \${1:true} )
		\${2}
	#else
		\${0}
	#end
#import
snippet #import
	#import ( "\${1:path/to/velocity/format}" )
# set
snippet #set
	#set ( \$\${1:var} = \${0} )
`;


/***/ })

}]);
//# sourceMappingURL=bundle.2327.js.map