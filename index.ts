import { run } from './context';
import { block, lit, variable, lambda, call } from './dsl';
import { blockToStr } from './printer';
import { transform } from './generator';
import { Point, Block } from './types';

const coolprog = block('_get_hyp', [], ['t'], [
  /*
  block('line', [lit.vec(0,0), lit.vec(100, 100)]),
  block('line', [lit.vec(100,0), lit.vec(0, 100)])
  */
  block('grid', [lit(3), lit(3)], ['g'], [
    block('each', [variable('g')], ['p'], [
      block('particle', [variable('p'), lambda(['p0'], call('addVecs', variable('p0'), lit.vec(0, .1)))], ['p0', 'p1'], [
        block('line', [variable('p0'), variable('p1')])
      ])
    ])
  ])
])

const bbFromLines = (lines: [Point, Point][]) => {
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity

  for (const points of lines) {
    for (const p of points) {
      if (p[0] < minX)
        minX = p[0]
      if (p[0] > maxX)
        maxX = p[0]
      if (p[1] < minY)
        minY = p[1]
      if (p[1] > maxY)
        maxY = p[1]
    }
  }
  return {minX, minY, maxX, maxY}
}

const linesToGroup = (lines: [Point, Point][]) => {
  return `<g>
  ${lines.map((line, i) =>
    `<path d="${line.reduce((m, [x, y], j) => m + `${j === 0 ? "M" : "L"}${x} ${y}`, "")}" vector-effect="non-scaling-stroke" stroke-width="1"></path>`
  ).join('')}
  </g>`
}

const svgns = "http://www.w3.org/2000/svg"

function render(lines: [Point, Point][]): SVGElement {
  const svg = document.createElementNS(svgns, "svg") as unknown as SVGElement
  const {minX, minY, maxX, maxY} = bbFromLines(lines)
  const width = maxX - minX
  const height = maxY - minY
  svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`)
  svg.innerHTML = linesToGroup(lines)
  return svg
}

function go() {
  let prog = coolprog

  function doTheThing(prog: Block): void {
    const svgs = document.getElementsByTagNameNS(svgns, "svg")
    if (svgs.length) svgs[0].remove()
    const lines = run(prog)
    console.log(blockToStr(prog))
    const svg = render(lines)
    document.body.appendChild(svg)
  }

  window.onload = () => doTheThing(prog)
  window.onkeypress = (e) => {
    prog = transform(prog)
    doTheThing(prog)
  }
}
go()

/*

console.log(blockToStr(coolprog))

console.log(blockToStr(coolerprog))
run(coolerprog)
*/