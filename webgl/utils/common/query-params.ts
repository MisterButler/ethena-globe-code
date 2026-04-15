import querystring from 'query-string'

/**
 * Get a query parameter
 *
 * @export
 * @param {string} prop
 * @param {Window} $window
 * @return {*}  {(void | string | boolean)}
 */
export function getQueryFromParams(prop: string, $window: Window): string | boolean {
  if ($window && $window.location && $window.location.search) {
    const params = querystring.parse($window.location.search.slice(1))
    return params[prop] !== undefined ? String(params[prop]) : false
  }
  return false
}

/**
 * Set a query parameter
 *
 * @export
 * @param {string} query
 * @param {string} value
 * @param {Window} $window
 * @param {boolean} [reload=false]
 * @return {*}  {void}
 */
export function setQuery(query: string, value: string, $window: Window, reload = false): void {
  if (typeof $window !== 'undefined') {
    const queries = querystring.parse($window.location.search)
    const newQueries = Object.assign({}, queries, {
      [query]: value,
    })
    const stringified = querystring.stringify(newQueries)

    if (reload) {
      $window.location.href = `${$window.location.pathname}?${stringified}`
      return
    }
    const url = `${$window.location.protocol}//${$window.location.host}${$window.location.pathname}?${stringified}`
    $window.history.pushState({ path: url }, '', url)
  }
}
