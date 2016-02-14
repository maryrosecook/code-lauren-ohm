var fs = require("fs");
var ohm = require("ohm-js");
var grammarText = fs.readFileSync("code-lauren.ohm");
var grammar = ohm.grammar(grammarText);

var ANNOTATE = "annotate";
var DO_NOT_ANNOTATE = "do_not_annotate";

var semantics = grammar.semantics().addOperation("bytecode", {
  ExpressionList: function(listOf) {
    var el = this;
    var expressions = listOf.extractListOf();
    var popsBc = mapCat(expressions.slice(1),
                        function(e) { return ins(["pop"], el); });

    return listOf.bytecode()
      .concat(popsBc)
      .concat(ins(["return"], el));
  },

  Expression: function(e) {
    return e.bytecode();
  },

  Assignment: function(name, _colon, value) {
    return value.bytecode()
      .concat(ins(["set_env", name.bytecode()], this, ANNOTATE));
  },

  Invocation: function(invocable, _brace, argList, _brace) {
    // TODO: port across TCO optimisation

    var args = argList.extractListOf();
    return ins(["arg_start"], argList)
      .concat(mapCat(args,
                     function(a) { return a.bytecode(); }))
      .concat(invocable.bytecode())
      .concat(ins(["invoke", args.length], this, ANNOTATE));
  },

  Lambda: function(_openBrace, parameterList, expressionList, _closeBrace) {
    var parameters = parameterList.extractListOf()
        .map(function(p) { return p.interval.contents.slice(1); });

    return ins(["push_lambda", { bc: expressionList.bytecode(), parameters: parameters }],
               this,
               ANNOTATE);
  },

  Block: function(lambda) {
    return ins(["arg_start"], this)
      .concat(lambda.bytecode())
      .concat(ins(["invoke", 0], this, DO_NOT_ANNOTATE));
  },

  Forever: function(_foreverKeyword, block) {
    return block.bytecode()
      .concat(ins(["pop"], this),
              ins(["jump", -4], this));
  },

  Conditional: function(ifStatement, elseifStatements, elseStatement) {
    return [ifStatement]
      .concat(elseifStatements.children)
      .concat(elseStatement.children)
      .map(function(s) { return s.bytecode(); })
      .concat([ins(["push", undefined], this)]) // terminal else in case no clauses run
      .reverse()
      .reduce(function(bc, clause) { // jump to end of conditional if a clause runs
        return clause
          .concat(ins(["jump", bc.length], ifStatement))
          .concat(bc);
      }, []);
  },

  If: function(_ifKeyword, conditionalExpression, block) {
    return conditionalExpression.bytecode()
      .concat(ins(["if_not_true_jump", 4], this))
      .concat(block.bytecode());
  },

  Elseif: function(_elseifKeyword, conditionalExpression, block) {
    return conditionalExpression.bytecode()
      .concat(ins(["if_not_true_jump", 4], this))
      .concat(block.bytecode());
  },

  Else: function(_elseKeyword, block) {
    return ins(["push", true], this, ANNOTATE)
      .concat(ins(["if_not_true_jump", 4], this))
      .concat(block.bytecode());
  },

  Literal: function(l) {
    return ins(["push", l.bytecode()], this, ANNOTATE);
  },

  identifierLookup: function(identifier) {
    return ins(["get_env", identifier.bytecode()], this, ANNOTATE);
  },

  identifier: function(firstLetter, restCharacters) {
    return firstLetter.interval.contents + restCharacters.interval.contents;
  },

  number: function(_, _, _, _) {
    return parseFloat(this.interval.contents, 10);
  },

  boolean: function(keyword) {
    return keyword.interval.contents === "true" ? true : false;
  },

  string: function(_quote, characters, _quote) {
    return characters.interval.contents;
  },

  listOf: function(l) {
    return l.bytecode();
  },

  listOf_some: function(first, _separators, restIter) {
    return first.bytecode()
      .concat(mapCat(restIter.children,
                     function(e) { return e.bytecode(); }));
  },

  listOf_none: function() {
    return ins(["push", undefined], this);
  }
}).addOperation("extractListOf", {
  listOf: function(l) {
    return l.extractListOf();
  },

  listOf_some: function(first, _separators, restIter) {
    return [first].concat(restIter.children);
  },

  listOf_none: function() {
    return [];
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
