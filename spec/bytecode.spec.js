var bytecode = require("../index").bytecode;

describe("bytecode compiler", function() {
  describe("top level", function() {
    it("should compile an empty program", function() {
      expect(stripBc(bytecode("")))
        .toEqual([["push", undefined],
                  ["return"]]);
    });

    it("should compile a program that returns 1", function() {
      expect(stripBc(bytecode("1")))
        .toEqual([["push", 1],
                  ["return"]]);
    });

    it("should compile a program that has four expressions and returns the fourth", function() {
      expect(stripBc(bytecode("1\n2\n3\n4")))
        .toEqual([["push", 1],
                  ["push", 2],
                  ["push", 3],
                  ["push", 4],
                  ["pop"],
                  ["pop"],
                  ["pop"],
                  ["return"]]);
    });
  });

  describe("assignments", function() {
    it("should compile an assignment", function() {
      expect(stripBc(bytecode("a1: 2")))
        .toEqual([["push", 2],
                  ["set_env", "a1"],
                  ["return"]]);
    });
  });

  describe("invocations", function() {
    it("should compile an invocation with no args", function() {
      expect(stripBc(bytecode("a1()")))
        .toEqual([["arg_start"],
                  ["get_env", "a1"],
                  ["invoke", 0],
                  ["return"]]);
    });

    it("should compile an invocation with two args", function() {
      expect(stripBc(bytecode("a1(2 b3)")))
        .toEqual([["arg_start"],
                  ["push", 2],
                  ["get_env", "b3"],
                  ["get_env", "a1"],
                  ["invoke", 2],
                  ["return"]]);
    });
  });

  describe("lambdas", function() {
    it("should compile an empty lambda", function() {
      expect(stripBc(bytecode("{}")))
        .toEqual([["push_lambda", { bc: [["push", undefined],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });

    it("should compile an empty lambda with some parameters", function() {
      expect(stripBc(bytecode("{ ?a1 ?b2 }")))
        .toEqual([["push_lambda", { bc: [["push", undefined],
                                         ["return"]],
                                    parameters: ["a1", "b2"]}],
                  ["return"]]);
    });

    it("should compile a lambda that returns 1", function() {
      expect(stripBc(bytecode("{ 1 }")))
        .toEqual([["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });

    it("should compile lambda that has 2 expressions and returns the second", function() {
      expect(stripBc(bytecode("{ 1 \n 2 }")))
        .toEqual([["push_lambda", { bc: [["push", 1],
                                         ["push", 2],
                                         ["pop"],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation on no arguments", function() {
      expect(stripBc(bytecode("{ a1() }")))
        .toEqual([["push_lambda", { bc: [["arg_start"],
                                         ["get_env", "a1"],
                                         ["invoke", 0],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });

    it("should compile lambda that contains an invocation with some arguments", function() {
      expect(stripBc(bytecode("{ a1(2 3) }")))
        .toEqual([["push_lambda", { bc: [["arg_start"],
                                         ["push", 2],
                                         ["push", 3],
                                         ["get_env", "a1"],
                                         ["invoke", 2],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });

    it("should compile invocation of lambda literal", function() {
      expect(stripBc(bytecode("{ {}() }")))
        .toEqual([["push_lambda", { bc: [["arg_start"],
                                         ["push_lambda", { bc: [["push", undefined],
                                                                ["return"]],
                                                           parameters: [] }],
                                         ["invoke", 0],
                                         ["return"]],
                                    parameters: []}],
                  ["return"]]);
    });
  });

  describe("forever", function() {
    it("should not annotate invoke", function() {
      var bc = bytecode("forever {}");
      expect(bc[2][0]).toEqual("invoke");
      expect(bc[2].annotate).toEqual(false);
    });
  });

  describe("conditionals", function() {
    it("should compile an if", function() {
      expect(stripBc(bytecode("if true { 1 }")))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/else", function() {
      expect(stripBc(bytecode("if true { 1 } else { 2 }")))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/else", function() {
      expect(stripBc(bytecode("if true { 1 } elseif false { 2 } else { 3 }")))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 14],

                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(stripBc(bytecode("if true { 1 } elseif false { 2 } elseif true { 3 } else { 4 }")))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 20],

                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 14],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 3],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 8],

                  ["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 4],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });

    it("should compile an if/elseif/elseif/else", function() {
      expect(stripBc(bytecode("if true { 1 } elseif false { 2 }")))
        .toEqual([["push", true],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 1],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 8],
                  ["push", false],
                  ["if_not_true_jump", 4],
                  ["arg_start"],
                  ["push_lambda", { bc: [["push", 2],
                                         ["return"]],
                                    parameters: [] }],
                  ["invoke", 0],
                  ["jump", 2],

                  ["push", undefined],
                  ["jump", 0],

                  ["return"]]);
    });
  });
});

function stripBc(bc) {
  bc.forEach(function(instruction) {
    delete instruction.start;
    delete instruction.end;
    delete instruction.annotate;
    if (instruction[0] === "push_lambda") {
      delete instruction[1].annotate;
      stripBc(instruction[1].bc);
    }
  });

  return bc;
};
