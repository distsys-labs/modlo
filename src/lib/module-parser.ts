/**
 * Extracts function parameter names from a function
 * Handles: function(a, b), (a, b) =>, a =>, async function(a)
 */
export function getArguments(fn: Function): string[] {
  const fnStr = fn.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')

  // Match: function name(params) or (params) => or name =>
  const match = fnStr.match(/(?:function\s*)?(?:\w+\s*)?\(([^)]*)\)/) ||
                fnStr.match(/(\w+)\s*=>/)

  if (!match) return []

  return match[1]
    .split(',')
    .map(arg => arg.trim().split('=')[0].trim())
    .filter(arg => arg.length > 0 && arg !== '...')
}
