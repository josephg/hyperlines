// const assert = require('assert')
import assert from 'assert'

enum Type {
  Scalar,
  Vec2,
  Function,
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
  fn: (args: any[], scope: Scope, bindingNames: string[], contents: Block[]) => void
}

type Expression = {
  type: 'scalar'
  value: number
} | {
  type: 'call'
  callee: Expression
  args: Expression[]
} | {
  type: 'variable'
  name: string
}

interface Block {
  name: string // must be one of the BlockDefs
  args: Expression[]
  bindingNames: string[]
  contents: Block[]
}


const globalFunctionsList: FunctionDef[] = [{
  name: 'Vec',
  argTypes: [Type.Scalar, Type.Scalar],
  outputType: Type.Vec2,
  fn: (x, y) => [x,y]
}]
const globalFunctions: {[k: string]: FunctionDef} = {}
globalFunctionsList.forEach(f => {globalFunctions[f.name] = f})

const globalBlocksList: BlockDef[] = [{
  name: '_get_hyp',
  argTypes: [Type.Scalar],
  fn: (args: any[], scope: Scope, bindingNames: string[], contents: Block[]) => {
    queueBlockContents(scope, contents)
  }
}, {
  name: 'line',
  argTypes: [Type.Vec2, Type.Vec2],
  fn: (args, scope, bindingNames, contents) => {
    const [start, end] = args
    console.log('line from', start, end)
  },
}]
const globalBlocks: {[k: string]: BlockDef} = {}
globalBlocksList.forEach(f => {globalBlocks[f.name] = f})


type Scope = {[k:string]: any}
const evaluate = (scope: Scope, expr: Expression): any => {
  switch (expr.type) {
    case 'scalar': return expr.value
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

  }
}

// queueBlockContents(subscope({}, {x: 123, y: 321})

const subScope = (parent: Scope, child: Scope) => (
  Object.assign(Object.create(parent, {}), child)
)

const queueBlockContents = (scope: Scope, contents: Block[]) => {
  contents.forEach(block => {
    const blockDef = globalBlocks[block.name]
    const args = block.args.map(a => evaluate(scope, a))
    blockDef.fn(args, scope, block.bindingNames, block.contents)
  })
}

const run = (program: Block) => {
  queueBlockContents(globalFunctions, [program])
}



const coolprog: Block = {
  name: '_get_hyp',
  bindingNames: ['t'],
  args: [],
  contents: [{
    name: 'line',
    bindingNames: [],
    args: [{
      type: 'call',
      callee: {
        type: 'variable',
        name: 'Vec',
      },
      args: [
        {type: 'scalar', value: 0},
        {type: 'scalar', value: 1},
      ]
    }, {
      type: 'call',
      callee: {
        type: 'variable',
        name: 'Vec',
      },
      args: [
        {type: 'scalar', value: 1},
        {type: 'scalar', value: 0},
      ]
    }],
    contents: []
  }]
}

run(coolprog)
