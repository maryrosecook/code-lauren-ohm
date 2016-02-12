var fs = require("fs");
var ohm = require("ohm-js");
var grammarText = fs.readFileSync("code-lauren.ohm");
var grammar = ohm.grammar(grammarText);

var ANNOTATE = "annotate";
var DO_NOT_ANNOTATE = "do_not_annotate";

function name(capture) {
  return capture._node.ctorName;
};

var semantics = grammar.semantics().addOperation('bytecode', {
  ExpressionList: function(listOf) {
    var el = this;
    var expressions = listOf.bytecode();
    var pops = mapCat(expressions.slice(1),
                      function(e) { return ins(["pop"], el); });

    return expressions
      .concat(pops)
      .concat(ins(["return"], el));
  },

  listOf: function(l) {
    return l.bytecode();
  },

  listOf_some: function(first, separators, restIter) {
    return first.bytecode()
      .concat(mapCat(restIter.children,
                     function(e) { return e.bytecode(); }));
  },

  listOf_none: function() {
    return ins(["push", undefined], this);
  },

  Expression: function(e) {
    return e.bytecode();
  },

  Literal: function(l) {
    return ins(["push", l.bytecode()], this, ANNOTATE);
  },

  number: function(_, _, _, _) {
    return parseFloat(this.interval.contents, 10);
  }
});

function bytecode(input) {
  var match = grammar.match(input);
  if (match.failed()) {
    throw new Error("Couldn't match input");
  }

  return semantics(match).bytecode();
};

function ins(instruction, capture, annotate) {
  instruction.start = capture._node.interval.startIdx;
  instruction.end = capture._node.interval.endIdx;
  instruction.annotate = (annotate === true ? true : false);
  return [instruction];
};

function mapCat(list, fn) {
  return list
    .reduce(function (acc, x) {
      return acc.concat(fn(x));
    }, []);
};


module.exports = {
  grammar: grammar,
  bytecode: bytecode
};
