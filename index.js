var fs = require("fs");
var ohm = require("ohm-js");
var grammarText = fs.readFileSync("code-lauren.ohm");
var grammar = ohm.grammar(grammarText);

var userInput = "Hello!";
var m = grammar.match(userInput);

if (m.succeeded()) {
  console.log("Greetings, human.");
} else {
  console.log("That's not a greeting!");
}
