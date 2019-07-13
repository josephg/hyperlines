import { Block, Expression } from "./types";
import { globalBlocks } from "./globals";


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

export const blockToStr = (block: Block, indent = ''): string => {
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
