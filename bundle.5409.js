"use strict";
(self["webpackChunkace_playground"] = self["webpackChunkace_playground"] || []).push([[5409],{

/***/ 55409:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
  THIS FILE WAS AUTOGENERATED BY mode.tmpl.js
*/

    

    var TextMode = (__webpack_require__(49432).Mode);
    var CspHighlightRules = (__webpack_require__(30278)/* .CspHighlightRules */ .m);
    var oop = __webpack_require__(2645);

    var Mode = function() {
        this.HighlightRules = CspHighlightRules;
    };

    oop.inherits(Mode, TextMode);

    (function() {
        this.$id = "ace/mode/csp";
    }).call(Mode.prototype);

    exports.Mode = Mode;


/***/ }),

/***/ 30278:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/*
    EXPLANATION

    This highlight rules were created to help developer spot typos when working
    with Content-Security-Policy (CSP). See:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/
 */

    

    var oop = __webpack_require__(2645);
    var TextHighlightRules = (__webpack_require__(16387)/* .TextHighlightRules */ .r);

    var CspHighlightRules = function() {
        var keywordMapper = this.createKeywordMapper({
            "constant.language": "child-src|connect-src|default-src|font-src|frame-src|img-src|manifest-src|media-src|object-src"
                  + "|script-src|style-src|worker-src|base-uri|plugin-types|sandbox|disown-opener|form-action|frame-ancestors|report-uri"
                  + "|report-to|upgrade-insecure-requests|block-all-mixed-content|require-sri-for|reflected-xss|referrer|policy-uri",
            "variable": "'none'|'self'|'unsafe-inline'|'unsafe-eval'|'strict-dynamic'|'unsafe-hashed-attributes'"
        }, "identifier", true);

        this.$rules = {
            start: [{
                token: "string.link",
                regex: /https?:[^;\s]*/
            }, {
                token: "operator.punctuation",
                regex: /;/
            }, {
                token: keywordMapper,
                regex: /[^\s;]+/
            }]
        };
    };

    oop.inherits(CspHighlightRules, TextHighlightRules);

    exports.m = CspHighlightRules;


/***/ })

}]);
//# sourceMappingURL=bundle.5409.js.map