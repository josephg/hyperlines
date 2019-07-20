import { Point, FunctionDef, Type, BlockDef, Scope, Expression, Block } from './types'
import { queueBlocks, queueBlock } from './context'

const addVecs = ([x1, y1]: Point, [x2, y2]: Point): Point => [x1 + x2, y1 + y2]

const subScope = (parent: Scope, child: Scope) => (
  Object.assign(Object.create(parent, {}), child)
)

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
export const globalFunctions: {[k: string]: FunctionDef} = {}
globalFunctionsList.forEach(f => {globalFunctions[f.name] = f})

const globalBlocksList: BlockDef[] = [{
  name: '_get_hyp',
  argTypes: [Type.Scalar],
  bindingTypes: [],
  fn: (ctx, args, scope, block) => {
    queueBlocks(ctx, scope, block.contents)
  }
}, {
  name: 'line',
  argTypes: [Type.Vec2, Type.Vec2],
  fn: (ctx, args, scope, block) => {
    const [start, end] = args
    ctx.lines.push([start, end])
  },
}, {
  name: 'grid',
  argTypes: [Type.Natural, Type.Natural],
  bindingTypes: [],
  fn: (ctx, args, scope, block) => {
    const [nx, ny] = args
    const points: [number, number][] = []
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) points.push([x/(nx === 1 ? 1 : nx-1),y/(ny === 1 ? 1 : ny-1)])
    queueBlocks(ctx, subScope(scope, {[block.bindingNames[0]]: points}), block.contents)
  }
}, {
  name: 'each',
  argTypes: [Type.Vec2Array],
  bindingTypes: [],
  fn: (ctx, args, scope, block) => {
    const [arr] = args
    for (const a of arr) {
      queueBlocks(ctx, subScope(scope, {[block.bindingNames[0]]: a}), block.contents)
    }
  }
}, {
  name: 'particle',
  argTypes: [Type.Vec2, Type.VecToVec],
  bindingTypes: [Type.Vec2, Type.Vec2],
  fn: (ctx, args, scope, block) => {
    const [pos, update] = args
    const nextPos = update(pos)
    queueBlocks(ctx, subScope(scope, {[block.bindingNames[0]]: pos, [block.bindingNames[1]]: nextPos}), block.contents)
    queueBlock(ctx, scope, {...block, args: [{type: 'literal', value: nextPos}, block.args[1]]})
  }
}]
export const globalBlocks: {[k: string]: BlockDef} = {}
globalBlocksList.forEach(f => {globalBlocks[f.name] = f})
