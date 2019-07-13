// const assert = require('assert')
import assert from 'assert'
import { Point, Expression, Block } from './types'
import { ExecutionCtx, queueBlock, run } from './context';
import { blockToStr } from './printer';



// queueBlockContents(subscope({}, {x: 123, y: 321})



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