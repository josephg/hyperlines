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
  type: 'literal'
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
}, {
  name: 'addVecs',
  argTypes: [Type.Vec2, Type.Vec2],
  outputType: Type.Vec2,
  fn: ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]
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
}, {
  name: 'grid',
  argTypes: [Type.Natural, Type.Natural],
  fn: (args, scope, bindingNames, contents) => {
    const [nx, ny] = args
    const points: [number, number][] = []
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) points.push([x/(nx === 1 ? 1 : nx-1),y/(ny === 1 ? 1 : ny-1)])
    queueBlockContents(subScope(scope, {[bindingNames[0]]: points}), contents)
  }
}, {
  name: 'each',
  argTypes: [Type.Vec2Array],
  fn: (args, scope, bindingNames, contents) => {
    const [arr] = args
    for (const a of arr) {
      queueBlockContents(subScope(scope, {[bindingNames[0]]: a}), contents)
    }
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
  contents: [
    {
      name: 'grid',
      args: [{
        type: 'literal',
        value: 2
      }, {
        type: 'literal',
        value: 2
      }],
      bindingNames: ['g'],
      contents: [
        {
          name: 'each',
          args: [{
            type: 'variable',
            name: 'g',
          }],
          bindingNames: ['p'],
          contents: [
            {
              name: 'line',
              bindingNames: [],
              args: [{
                type: 'variable',
                name: 'p'
              }, {
                type: 'call',
                callee: {
                  type: 'variable',
                  name: 'addVecs',
                },
                args: [
                  {
                    type: 'variable',
                    name: 'p'
                  },
                  {
                    type: 'call',
                    callee: {
                      type: 'variable',
                      name: 'Vec',
                    },
                    args: [
                      { type: 'literal', value: 1 },
                      { type: 'literal', value: 0 },
                    ]
                  }
                ]
              }],
              contents: []
            }
          ]
        }
      ]
    },
  ]
}

run(coolprog)
