var fs = require("fs");
var ohm = require("ohm-js");
var grammarText = fs.readFileSync("code-lauren.ohm");
var grammar = ohm.grammar(grammarText);

describe("atoms", function() {
  it("should parse an int", function() {
    expect(grammar.match("1").succeeded()).toBe(true);
    expect(grammar.match("123").succeeded()).toBe(true);
  });

  it("should parse a float", function() {
    expect(grammar.match("1.12").succeeded()).toBe(true);
    expect(grammar.match("11.22").succeeded()).toBe(true);

    expect(grammar.match("11.").succeeded()).toBe(false);
  });

  it("should parse a negative int", function() {
    expect(grammar.match("-11").succeeded()).toBe(true);
  });

  it("should parse a negative float", function() {
    expect(grammar.match("-11.22").succeeded()).toBe(true);
  });

  it("should parse a string", function() {
    expect(grammar.match('"hello - my name is mary"').succeeded()).toBe(true);
  });

  it("should parse a label", function() {
    expect(grammar.match("person").succeeded()).toBe(true);
  });

  it("should fail to pass a label that begins with an int", function() {
    expect(grammar.match("1person").succeeded()).toBe(false);
  });
});

describe("lambda", function() {
  it("should parse an uninvoked lambda with no params or body", function() {
    expect(grammar.match("{}").succeeded()).toBe(true);
  });

  it("should parse an uninvoked lambda with a couple of literals as its body", function() {
    expect(grammar.match("{ 1 \n 2 }").succeeded()).toBe(true);
  });

  it("should parse an uninvoked lambda with two params and no body", function() {
    expect(grammar.match("{ ?name ?height }").succeeded()).toBe(true);
  });

  it("should parse an uninvoked lambda with two params and two body expressions", function() {
    expect(grammar.match("{ ?a ?b 1 \n 2 }").succeeded()).toBe(true);
  });

  it("should allow newlines and spaces between every element of a lambda", function() {
    expect(grammar.match("{ \n ?a \n ?b \n 1 \n 1 \n }").succeeded()).toBe(true);
  });
});

describe("invocation", function() {
  it("shouldn't parse an invocation of nothing", function() {
    expect(grammar.match("()").succeeded()).toBe(false);
  });

  it("should parse an invocation with no args", function() {
    expect(grammar.match("print()").succeeded()).toBe(true);
  });

  it("should parse an invocation with two args", function() {
    expect(grammar.match("print(name height)").succeeded()).toBe(true);
  });

  it("should parse an invocation on an arg that results from an invocation", function() {
    expect(grammar.match("print(get(shopping 1))").succeeded()).toBe(true);
  });

  it("should parse an invoked lambda with param and body and arg", function() {
    expect(grammar.match("{ ?a add(a) }(1)").succeeded()).toBe(true);
  });

  it("should allow args on different lines", function() {
    expect(grammar.match("print(add(1) \n subtract(2))").succeeded()).toBe(true);
  });

  it("should allow args on different lines surrounded by spaces", function() {
    expect(grammar.match("print( 1 \n 2 )").succeeded()).toBe(true);
  });

  it("should parse a double invocation", function() {
    expect(grammar.match("print()()").succeeded()).toBe(true);
  });

  it("should parse a quadruple invocation w args", function() {
    expect(grammar.match("print(1)(2)(3)(4)").succeeded()).toBe(true);
  });

  it("should parse a lambda invocation that produces a lambda that is invoked", function() {
    expect(grammar.match("{ {} }()()").succeeded()).toBe(true);
  });

  it("should be able to invoke result of conditional", function() {
    expect(grammar.match("if true { }()").succeeded()).toBe(true);
  });

  // regression
  it("should allow leading whitespace before first arg", function() {
    expect(grammar.match("a( 1)").succeeded()).toBe(true);
  });
});

describe("assignments", function() {
  it("should parse an assignment of a number", function() {
    expect(grammar.match("name: 1").succeeded()).toBe(true);
  });

  it("should parse an assignment of a lambda", function() {
    expect(grammar.match("name: { ?a a }").succeeded()).toBe(true);
  });

  it("should parse an assignment of an invocation of a lambda", function() {
    expect(grammar.match("name: { ?a a }(1)").succeeded()).toBe(true);
  });

  it("should parse an assignment of an invocation of a label", function() {
    expect(grammar.match("name: add(1)").succeeded()).toBe(true);
  });

  it("should allow space before expression after assignment", function() {
    expect(grammar.match('name: "Lauren" \n name').succeeded()).toBe(true);
  });
});

describe("conditionals", function() {
  it("should parse an conditional with an if", function() {
    expect(grammar.match("if true { 1 }").succeeded()).toBe(true);
  });

  it("should parse an conditional with if and else if", function() {
    expect(grammar.match("if true { 1 } elseif false { 2 }").succeeded()).toBe(true);
  });

  it("should parse an conditional with an if, else if and else", function() {
    expect(grammar.match("if true { 1 } elseif false { 2 } else { 3 }").succeeded()).toBe(true);
  });

  it("should parse an conditional with if, two else ifs and else", function() {
    expect(grammar.match("if true { } elseif false { } elseif false { } else { }").succeeded())
      .toBe(true);
  });

  it("should parse an conditional with if w invoked conditional", function() {
    expect(grammar.match("if really(true) { }").succeeded()).toBe(true);
  });

  it("should not allow else with condition", function() {
    expect(grammar.match("if true { 1 } else false { 2 }").succeeded()).toBe(false);
  });
});

describe("top", function() {
  it("should allow an empty program", function() {
    expect(grammar.match("").succeeded()).toBe(true);
  });

  it("should allow a list of top level expressions on separate lines", function() {
    expect(grammar.match("print1()\nprint2()").succeeded()).toBe(true);
  });
});

describe("expression lists", function() {
  it("should not allow multiple expressions on same line of do block", function() {
    expect(grammar.match("a: 1 1").succeeded()).toBe(false);
    expect(grammar.match("1 1").succeeded()).toBe(false);
    expect(grammar.match("{}() {}()").succeeded()).toBe(false);
    expect(grammar.match("print() print()").succeeded()).toBe(false);
  });

  it("should allow blank line with space", function() {
    expect(grammar.match(" 1 \n \n 2").succeeded()).toBe(true);
  });
});
