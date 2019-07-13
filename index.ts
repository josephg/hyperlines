// const assert = require('assert')
import assert from 'assert'

enum Type {
  Scalar,
  Natural,
  Vec2,
  Function,
  Vec2Array,
  ScalarArray,
  NaturalArray,
  VecToVec,
}

interface FunctionDef {
  name: string
  argTypes: Type[]
  outputType: Type
  fn: (...args: any) => any
}

interface BlockDef {
  name: string
  argTypes: Type[]
  bindingTypes?: Type[]
  fn: (args: any[], scope: Scope, block: Block) => void
}

type Expression = {
  type: 'literal'
  value: number | Point
} | {
  type: 'variable'
  name: string
} | {
  type: 'call'
  callee: Expression
  args: Expression[]
} | {
  type: 'lambda',
  argNames: string[],
  expr: Expression
}

interface Block {
  name: string // must be one of the BlockDefs
  args: Expression[]
  bindingNames: string[]
  contents: Block[]
}

type Point = [number, number]

const addVecs = ([x1, y1]: Point, [x2, y2]: Point): Point => [x1 + x2, y1 + y2]

const globalFunctionsList: FunctionDef[] = [{
  name: 'Vec',
  argTypes: [Type.Scalar, Type.Scalar],
  outputType: Type.Vec2,
  fn: (x, y) => [x,y]
}, {
  name: 'addVecs',
  argTypes: [Type.Vec2, Type.Vec2],
  outputType: Type.Vec2,
  fn: addVecs
}]
const globalFunctions: {[k: string]: FunctionDef} = {}
globalFunctionsList.forEach(f => {globalFunctions[f.name] = f})

const globalBlocksList: BlockDef[] = [{
  name: '_get_hyp',
  argTypes: [Type.Scalar],
  bindingTypes: [],
  fn: (args, scope, block) => {
    queueBlocks(scope, block.contents)
  }
}, {
  name: 'line',
  argTypes: [Type.Vec2, Type.Vec2],
  fn: (args, scope, block) => {
    const [start, end] = args
    console.log('line from', start, end)
  },
}, {
  name: 'grid',
  argTypes: [Type.Natural, Type.Natural],
  bindingTypes: [],
  fn: (args, scope, block) => {
    const [nx, ny] = args
    const points: [number, number][] = []
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) points.push([x/(nx === 1 ? 1 : nx-1),y/(ny === 1 ? 1 : ny-1)])
    queueBlocks(subScope(scope, {[block.bindingNames[0]]: points}), block.contents)
  }
}, {
  name: 'each',
  argTypes: [Type.Vec2Array],
  bindingTypes: [],
  fn: (args, scope, block) => {
    const [arr] = args
    for (const a of arr) {
      queueBlocks(subScope(scope, {[block.bindingNames[0]]: a}), block.contents)
    }
  }
}, {
  name: 'particle',
  argTypes: [Type.Vec2, Type.VecToVec],
  bindingTypes: [Type.Vec2, Type.Vec2],
  fn: (args, scope, block) => {
    const [pos, update] = args
    const nextPos = update(pos)
    queueBlocks(subScope(scope, {[block.bindingNames[0]]: pos, [block.bindingNames[1]]: nextPos}), block.contents)
    queueBlock(scope, {...block, args: [{type: 'literal', value: nextPos}, block.args[1]]})
  }
}]
const globalBlocks: {[k: string]: BlockDef} = {}
globalBlocksList.forEach(f => {globalBlocks[f.name] = f})


type Scope = {[k:string]: any}
const evaluate = (scope: Scope, expr: Expression): any => {
  switch (expr.type) {
    case 'literal': return expr.value
    case 'variable': {
      const val = scope[expr.name]
      assert(val != null)
      return val
    }
    case 'call': {
      const callee = evaluate(scope, expr.callee) as FunctionDef
      assert(callee != null && typeof callee === 'object')
      const args = expr.args.map(arg => evaluate(scope, arg))
      return callee.fn(...args)
    }
    case 'lambda': {
      return (...args: any[]) => {
        const childScope = Object.create(scope)
        args.forEach((a, i) => { childScope[expr.argNames[i]] = a })
        return evaluate(childScope, expr.expr)
      }
    }
  }
}

// queueBlockContents(subscope({}, {x: 123, y: 321})

const subScope = (parent: Scope, child: Scope) => (
  Object.assign(Object.create(parent, {}), child)
)

const queue: (() => void)[] = []

const queueBlock = (scope: Scope, block: Block) => {
  queue.push(() => {
    const blockDef = globalBlocks[block.name]
    const args = block.args.map(a => evaluate(scope, a))
    blockDef.fn(args, scope, block)
  })
}

const queueBlocks = (scope: Scope, contents: Block[]) => {
  for (const block of contents)
    queueBlock(scope, block)
}

const exprToStr = (expr: Expression): string => {
  switch (expr.type) {
    case 'literal': {
      return Array.isArray(expr.value)
        ? `[${expr.value.join(', ')}]`
        : `${expr.value}`
    }
    case 'variable': return expr.name
    case 'call':
      return `${exprToStr(expr.callee)}(${expr.args.map(exprToStr).join(', ')})`
    case 'lambda':
      return `\\${expr.argNames.join(', ')} -> ${exprToStr(expr.expr)}`
  }
}

const blockToStr = (block: Block, indent = ''): string => {
  const fnPart = `${indent}${block.name} (${block.args.map(exprToStr)})`
  if (globalBlocks[block.name].bindingTypes == null) {
    return fnPart + '\n'
  } else {
    const blockHead = ` {|${block.bindingNames.join(', ')}|\n`
    const childIndent = indent + '  '
    const childBlocks = block.contents.map(b => blockToStr(b, childIndent)).join('\n')
    // const ret = block.return `${indent}return ${exprToStr(
    return fnPart + blockHead + childBlocks + `${indent}}\n`
  }
}

const run = (program: Block) => {
  queueBlock(globalFunctions, program)
  let n = 0
  while (queue.length > 0) {
    queue.shift()!()
    if (n++ > 100) break
  }
}

const lit = (value: number | Point): Expression => ({type: 'literal', value})
lit.vec = (x: number, y: number) => call('Vec', lit(x), lit(y))
const variable = (name: string): Expression => ({type: 'variable', name})
const call = (fnName: string, ...args: Expression[]): Expression => ({type: 'call', callee: variable(fnName), args})
const block = (name: string, args: Expression[], bindingNames: string[] = [], contents: Block[] = []) => ({name, args, bindingNames, contents})
const lambda = (argNames: string[], expr: Expression): Expression => ({type: 'lambda', argNames, expr})

const coolprog = block('_get_hyp', [], ['t'], [
  block('grid', [lit(2), lit(2)], ['g'], [
    block('each', [variable('g')], ['p'], [
      block('particle', [variable('p'), lambda(['p0'], call('addVecs', variable('p0'), lit.vec(0, .1)))], ['p0', 'p1'], [
        block('line', [variable('p0'), variable('p1')])
      ])
    ])
  ])
])

run(coolprog)

console.log(blockToStr(coolprog))