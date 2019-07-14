import assert from 'assert'
import { Block, Expression, Type, returnTypeOf, argTypeOf, Scope } from "./types";
import { globalBlocks, globalFunctions } from "./globals";
import { exprToStr } from './printer';
import { block, lit } from './dsl';

const seeds: Block[] = [
]

type ScopeTypes = {[k: string]: Type}

interface Visitor {
  visitExpr?(e: Expression, type: Type, scopeTypes: ScopeTypes): Expression
  visitBlock?(b: Block, scopeTypes: ScopeTypes): Block
}

const eachExprInExpr = (e: Expression, type: Type, scopeTypes: ScopeTypes, fn: (e: Expression, type: Type, scopeTypes: ScopeTypes) => Expression): Expression => {
  const e2: Expression = {...e}
  switch (e2.type) {
    case 'call': {
      // TODO: Callee. Potentially find other functions 
      const argTypes = globalFunctions[e2.callee].argTypes
      e2.args = e2.args.map((e, i) => eachExprInExpr(e, argTypes[i], scopeTypes, fn))
      break
    }
    case 'lambda': {
      const retType = returnTypeOf[type]
      assert(retType)
      const subScope = Object.create(scopeTypes)
      const argTypes = argTypeOf[type]
      assert(argTypes)
      e2.argNames.forEach((a, i) => { subScope[a] = argTypes[i] })
      e2.expr = eachExprInExpr(e2.expr, retType, subScope, fn)
      break
    }

  }
  return fn(e2, type, scopeTypes)
}

const visitBlock = (b: Block, scopeTypes: ScopeTypes, v: Visitor): Block => {
  const def = globalBlocks[b.name]
  let childScope = scopeTypes
  if (def.bindingTypes != null) {
    childScope = Object.create(scopeTypes)
    b.bindingNames.forEach((b, i) => childScope[b] = def.bindingTypes![i])
  }

  const newB = {
    ...b,
    args: v.visitExpr ? b.args.map((a, i) => eachExprInExpr(a, def.argTypes[i], scopeTypes, v.visitExpr!)) : b.args,
    contents: b.contents.map(c => visitBlock(c, childScope, v))
  }
  return v.visitBlock ? v.visitBlock(newB, scopeTypes) : newB
}

const countExprs = (b: Block): number => {
  let n = 0
  visitBlock(b, {}, {visitExpr: (e) => { n++; return e }})
  return n
}

const countBlocks = (b: Block): number => {
  let n = 0
  visitBlock(b, {}, {visitBlock: (e) => { n++; return e }})
  return n
}

const mutateExpr = (e: Expression, type: Type, scopeTypes: ScopeTypes): Expression => {
  switch (type) {
    case Type.Scalar:
      return {type: 'literal', value: 20}
    default:
      return e
  }
}
const mutateBlock = (b: Block, scopeTypes: ScopeTypes): Block => {
  return {
    ...b,
    contents: b.contents.concat([
      block('line', [lit.vec(0, 0), lit.vec(0, 1)])
    ])
  }
}

export const transform = (program: Block): Block => {
  if (Math.random() < 0.5) {
    const n = countExprs(program)
    let i = (Math.random() * n) | 0
    // TODO: Bring global function types in
    return visitBlock(program, {}, {visitExpr: (e, type, scopeTypes) => {
      if (!i--) {
        return mutateExpr(e, type, scopeTypes)
      }
      return e
    }})
  } else {
    const n = countBlocks(program)
    let i = (Math.random() * n) | 0
    return visitBlock(program, {}, {visitBlock: (b, scopeTypes) => {
      if (!i--) {
        return mutateBlock(b, scopeTypes)
      }
      return b
    }})
  }
}