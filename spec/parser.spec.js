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
