import { run } from './context';
import { block, lit, variable, lambda, call } from './dsl';
import { blockToStr } from './printer';

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