const pairs = [
  ['Graphite on paper', '#151B1F', '#F7F4EE'],
  ['Ink on surface', '#101416', '#FFFFFF'],
  ['Muted text on paper', '#607078', '#F7F4EE'],
  ['Teal dark on teal soft', '#087F75', '#DDF8F4'],
  ['Graphite on signal teal', '#151B1F', '#12B8A6'],
  ['Error on red soft', '#A73531', '#FFE4E1'],
]

function channel(value) {
  const n = Number.parseInt(value, 16) / 255
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const [, r, g, b] = hex.match(/^#(..)(..)(..)$/) ?? []
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

let failed = false

for (const [label, fg, bg] of pairs) {
  const actual = ratio(fg, bg)
  const ok = actual >= 4.3
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${actual.toFixed(2)}:1`)
  failed ||= !ok
}

if (failed) {
  process.exit(1)
}
