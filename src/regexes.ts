import { regex } from 'shorol'

const urlLikeRegex = regex()
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
  .toRegExp('i')

export { urlLikeRegex }
