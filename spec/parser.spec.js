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

  // it("should be able to invoke result of conditional", function() {
  //   var ast = parse("if true { }()");
  //   expect(util.stripAst(util.getNodeAt(ast, ["top", "do", 0, "return"])))
  //     .toEqual({ t: "invocation",
  //                c: [{ t: "conditional",
  //                      c: [{ t: "boolean", c: true },
  //                          { t: "invocation",
  //                            c: [{ t: "lambda",
  //                                  c: [[], { t: "do",
  //                                            c: [{ t : 'return',
  //                                                  c : { t : 'undefined',
  //                                                        c : undefined } }] }] }] }]}]});
  // });

  // regression
  it("should allow leading whitespace before first arg", function() {
    expect(grammar.match("a( 1)").succeeded()).toBe(true);
  });
});
