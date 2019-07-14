import { ExecutionCtx } from "./context";

export enum Type {
  Scalar,
  Natural,
  Vec2,
  Vec2Array,
  ScalarArray,
  NaturalArray,
  VecToVec,
}

export const returnTypeOf: {[k: number]: Type} = {
  [Type.VecToVec]: Type.Vec2
}

export const argTypeOf: {[k: number]: Type[]} = {
  [Type.VecToVec]: [Type.Vec2]
}


export interface FunctionDef {
  name: string
  argTypes: Type[]
  outputType: Type
  fn: (...args: any) => any
}

export interface BlockDef {
  name: string
  argTypes: Type[]
  bindingTypes?: Type[]
  fn: (ctx: ExecutionCtx, args: any[], scope: Scope, block: Block) => void
}

export type Expression = {
  type: 'literal'
  value: number | Point
} | {
  type: 'variable'
  name: string
} | {
  type: 'call'
  // callee: Expression
  callee: string
  args: Expression[]
} | {
  type: 'lambda',
  argNames: string[],
  expr: Expression
}

export interface Block {
  name: string // must be one of the BlockDefs
  args: Expression[]
  bindingNames: string[]
  contents: Block[]
}

export type Point = [number, number]

export type Scope = {[k:string]: any}