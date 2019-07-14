import assert from 'assert'
import { Block, Expression, Type, returnTypeOf, argTypeOf } from "./types";
import { globalBlocks, globalFunctions } from "./globals";
import { exprToStr } from './printer';

const seeds: Block[] = [
]

type ScopeTypes = {[k: string]: Type}

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

const eachExprInBlock = (b: Block, scopeTypes: ScopeTypes, fn: (e: Expression, type: Type) => Expression): Block => {
  const def = globalBlocks[b.name]
  let childScope = scopeTypes
  if (def.bindingTypes != null) {
    childScope = Object.create(scopeTypes)
    b.bindingNames.forEach((b, i) => childScope[b] = def.bindingTypes![i])
  }

  return {
    ...b,
    args: b.args.map((a, i) => eachExprInExpr(a, def.argTypes[i], scopeTypes, fn)),
    contents: b.contents.map(c => eachExprInBlock(c, childScope, fn))
  }
}

export const transform = (program: Block): Block => {
  // TODO: Bring global function types in
  eachExprInBlock(program, {}, (e, type) => {
    console.log(exprToStr(e))
    return e
  })
  return program
}