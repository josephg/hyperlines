import assert from 'assert'
import { Point, Scope, Block, Expression, FunctionDef } from "./types";
import { globalBlocks, globalFunctions } from "./globals";

export interface ExecutionCtx {
  lines: [Point, Point][]
  queue: (() => void)[]
}


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

export const queueBlock = (ctx: ExecutionCtx, scope: Scope, block: Block) => {
  ctx.queue.push(() => {
    const blockDef = globalBlocks[block.name]
    const args = block.args.map(a => evaluate(scope, a))
    blockDef.fn(ctx, args, scope, block)
  })
}

export const queueBlocks = (ctx: ExecutionCtx, scope: Scope, contents: Block[]) => {
  for (const block of contents)
    queueBlock(ctx, scope, block)
}

export const run = (program: Block) => {
  const ctx: ExecutionCtx = {
    lines: [], queue: []
  }
  queueBlock(ctx, globalFunctions, program)
  let n = 0
  while (ctx.queue.length > 0) {
    ctx.queue.shift()!()
    if (n++ > 100) break
  }
}