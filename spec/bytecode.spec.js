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
});

function stripBc(bc) {
  bc.forEach(function(instruction) {
    delete instruction.start;
    delete instruction.end;
    delete instruction.annotate;
    if (instruction[0] === "push_lambda") {
      delete instruction[1].type;
      delete instruction[1].parameters;
      delete instruction[1].annotate;
      stripBc(instruction[1].bc);
    }
  });

  return bc;
};
