import { Point, Expression, Block } from './types'

export const lit = (value: number | Point): Expression => ({type: 'literal', value})
lit.vec = (x: number, y: number) => call('Vec', lit(x), lit(y))
export const variable = (name: string): Expression => ({type: 'variable', name})
export const call = (fnName: string, ...args: Expression[]): Expression => ({type: 'call', callee: variable(fnName), args})
export const block = (name: string, args: Expression[], bindingNames: string[] = [], contents: Block[] = []) => ({name, args, bindingNames, contents})
export const lambda = (argNames: string[], expr: Expression): Expression => ({type: 'lambda', argNames, expr})
