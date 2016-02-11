var fs = require("fs");
var ohm = require("ohm-js");
var grammarText = fs.readFileSync("code-lauren.ohm");
module.exports = ohm.grammar(grammarText);
