import { regex } from 'shorol';

// Your existing URL regex
export const urlLikeRegex = regex()
  .start()
  .group((builder) =>
    builder
      .literal('http')
      .group((inner) => inner.literal('s').optional())
      .literal('://')
  )
  .optional()
  .noneOf(' \t\n\r/')
  .oneOrMore()
  .literal('.')
  .noneOf(' \t\n\r')
  .oneOrMore()
  .any()
  .zeroOrMore()
  .end()
  .toRegExp('i');

// New Email Regex using Shorol
export const emailRegex = regex()
  .start()
  .noneOf(' @')
  .oneOrMore()
  .literal('@')
  .noneOf(' @')
  .oneOrMore()
  .literal('.')
  .noneOf(' @')
  .repeat(2)
  .end()
  .toRegExp('i');

// New Phone Regex using Shorol
export const phoneRegex = regex()
  .start()
  .literal('+')
  .optional()
  .digit()
  .repeat(7, 15)
  .end()
  .toRegExp();