/**
 * @file JavaScript grammar for tree-sitter
 * @author Max Brunsfeld <maxbrunsfeld@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'javascript',

  externals: $ => [
    $._template_chars,
    $.html_comment,
    $.escape_sequence,
  ],

  extras: $ => [
    $.html_comment,
    /[\s\p{Zs}\uFEFF\u2028\u2029\u2060\u200B]/,
  ],

  supertypes: $ => [
    $.expression,
    $.primary_expression,
  ],

  inline: $ => [
  ],

  precedences: $ => [
    [$.primary_expression, 'object'],
  ],

  conflicts: $ => [
  ],

  rules: {
    program: $ => seq(
      repeat($.expression_statement),
    ),

    expression_statement: $ => $.expression,

    expression: $ => $.primary_expression,

    primary_expression: $ => choice(
      $.identifier,
      $.parenthesized_expression,
      $.number,
      $.string,
      $.template_string,
      $.true,
      $.false,
      $.null,
      $.object,
      $.array,
    ),

    object: $ => prec('object', seq(
      '{',
      commaSep(optional(choice(
        $.pair,
      ))),
      '}',
    )),

    pair: $ => seq(
      field('key', $._property_name),
      ':',
      field('value', $.expression),
    ),

    _property_name: $ => choice(
      $.identifier,
      $.string,
      $.number,
      $.computed_property_name,
    ),

    computed_property_name: $ => seq(
      '[',
      $.expression,
      ']',
    ),

    array: $ => seq(
      '[',
      commaSep(optional(choice(
        $.expression,
      ))),
      ']',
    ),

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')',
    ),

    template_string: $ => seq(
      '`',
      repeat(choice(
        alias($._template_chars, $.string_fragment),
        $.escape_sequence,
        $.template_substitution,
      )),
      '`',
    ),

    template_substitution: $ => seq(
      '${',
      $.expression,
      '}',
    ),

    string: $ => choice(
      seq(
        '"',
        repeat(choice(
          alias($.unescaped_double_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        '"',
      ),
      seq(
        '\'',
        repeat(choice(
          alias($.unescaped_single_string_fragment, $.string_fragment),
          $.escape_sequence,
        )),
        '\'',
      ),
    ),

    unescaped_double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
    unescaped_single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u\{[0-9a-fA-F]+\}/,
        /[\r?][\n\u2028\u2029]/,
      ),
    )),

    identifier: _ => /[a-zA-Z_$][a-zA-Z0-9_$]*/,

    number: _ => {
      const hexLiteral = seq(
        choice('0x', '0X'),
        /[\da-fA-F](_?[\da-fA-F])*/,
      );
      const decimalDigits = /\d(_?\d)*/;
      const signedInteger = seq(optional(choice('-', '+')), decimalDigits);
      const exponentPart = seq(choice('e', 'E'), signedInteger);
      const binaryLiteral = seq(choice('0b', '0B'), /[0-1](_?[0-1])*/);
      const octalLiteral = seq(choice('0o', '0O'), /[0-7](_?[0-7])*/);
      const bigintLiteral = seq(choice(hexLiteral, binaryLiteral, octalLiteral, decimalDigits), 'n');
      const decimalIntegerLiteral = choice(
        '0',
        seq(optional('0'), /[1-9]/, optional(seq(optional('_'), decimalDigits))),
      );
      const decimalLiteral = choice(
        seq(decimalIntegerLiteral, '.', optional(decimalDigits), optional(exponentPart)),
        seq('.', decimalDigits, optional(exponentPart)),
        seq(decimalIntegerLiteral, exponentPart),
        decimalDigits,
      );
      return token(choice(
        hexLiteral,
        decimalLiteral,
        binaryLiteral,
        octalLiteral,
        bigintLiteral,
      ));
    },

    true: _ => 'true',
    false: _ => 'false',
    null: _ => 'null',
    undefined: _ => 'undefined',
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}