import { regex } from 'shorol'

const urlSchemeRegex = regex()
  .start()
  .literal('http')
  .group((builder) => builder.literal('s').optional())
  .literal('://')
  .toRegExp('i')

export { urlSchemeRegex }
