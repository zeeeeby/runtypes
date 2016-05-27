import Settings from './settings'
import {
  isType,
  checkType,

  errNotAType,
  errMissingRecordFields,
  errExtraneousRecordFields,
  errBadRecordFieldValue,
  errAttemptedFieldMutation,
  errGetNonexistentRecordField
} from './util'

const keyDiff = (obj1, obj2) => {
  const uniqueTo1 = []
  for (const key in obj1) {
    if (!(key in obj2))
      uniqueTo1.push(key)
  }
  return uniqueTo1.reverse()
}

export default (spec) => {

  for (const key in spec) {
    const type = spec[key]
    if (!isType(type))
      throw new TypeError(errNotAType(type))
  }

  return (obj) => {
    const missingKeys = keyDiff(spec, obj)
    if (missingKeys.length > 0)
      throw new TypeError(errMissingRecordFields(missingKeys))

    const extraKeys = keyDiff(obj, spec)
    if (extraKeys.length > 0)
      throw new TypeError(errExtraneousRecordFields(extraKeys))

    for (const key in obj) {
      const val = obj[key]
      const type = spec[key]
      const errMsg = checkType(val, type)
      if (errMsg)
        throw new TypeError(errBadRecordFieldValue(val, key, errMsg))
    }

    // If our environment supports proxies, use them to prevent accessing
    // nonexistent fields
    if (typeof Proxy === 'function') {
      return new Proxy(Object.freeze(obj), {
        get(_, key) {
          if (key in obj)
            return obj[key]
          else
            throw new TypeError(errGetNonexistentRecordField(key, Object.keys(obj)))
        },
        set() {
          throw new TypeError(errAttemptedFieldMutation)
        }
      })
    }

    // Second best option: freeze it
    if (typeof Object.freeze === 'function') {
      return Object.freeze(obj)
    }

    return obj
  }
}
