import { describe, expect, it } from 'vitest'
import { compile, formulaToString, SheetModel, usedFunctions } from './engine'
import { isError } from './types'

function calc(formula: string, cells: Record<string, string | number | null> = {}) {
  const s = new SheetModel({ ...cells, Z99: formula })
  return s.get('Z99')
}

describe('analyse et calcul', () => {
  it('opérations et priorités', () => {
    expect(calc('=1+2*3')).toBe(7)
    expect(calc('=(1+2)*3')).toBe(9)
    expect(calc('=2^3^2')).toBe(64)
    expect(calc('=-2^2')).toBe(4)
    expect(calc('=50%*200')).toBe(100)
    expect(calc('=10/0')).toMatchObject({ code: '#DIV/0!' })
  })

  it('convention française et anglaise', () => {
    expect(calc('=SOMME(1,5;2)')).toBe(3.5)
    expect(calc('=SUM(1.5,2)')).toBe(3.5)
    expect(calc('=A1*1,5', { A1: 2 })).toBe(3)
    expect(calc('=arrondi(2,345;2)')).toBe(2.35)
  })

  it('références, plages et dépendances', () => {
    const s = new SheetModel({ A1: 1, A2: 2, A3: '=A1+A2', A4: '=SOMME(A1:A3)' })
    expect(s.get('A4')).toBe(6)
    const c = new SheetModel({ A1: '=A2', A2: '=A1' })
    expect(c.get('A1')).toMatchObject({ code: '#CIRC!' })
  })

  it('texte et comparaisons', () => {
    expect(calc('="Prime : "&A1', { A1: 12.5 })).toBe('Prime : 12,5')
    expect(calc('=A1="auto"', { A1: 'Auto' })).toBe(true)
    expect(calc('=SI(A1>1000;"Gros";"Petit")', { A1: 1500 })).toBe('Gros')
    expect(calc('=SIERREUR(1/0;"err")')).toBe('err')
  })

  it('fonctions conditionnelles', () => {
    const cells = { A1: 'Auto', A2: 'Habitation', A3: 'Auto', B1: 100, B2: 200, B3: 300, C1: 'Nord', C2: 'Nord', C3: 'Sud' }
    expect(calc('=SOMME.SI(A1:A3;"Auto";B1:B3)', cells)).toBe(400)
    expect(calc('=NB.SI(B1:B3;">150")', cells)).toBe(2)
    expect(calc('=SOMME.SI.ENS(B1:B3;A1:A3;"Auto";C1:C3;"Sud")', cells)).toBe(300)
    expect(calc('=NB.SI.ENS(A1:A3;"A*")', cells)).toBe(2)
    expect(calc('=MOYENNE.SI(A1:A3;"<>Auto";B1:B3)', cells)).toBe(200)
  })

  it('recherches', () => {
    const cells = { A1: 'C001', A2: 'C002', A3: 'C003', B1: 10, B2: 20, B3: 30 }
    expect(calc('=RECHERCHEV("C002";A1:B3;2;FAUX)', cells)).toBe(20)
    expect(calc('=RECHERCHEV("C009";A1:B3;2;0)', cells)).toMatchObject({ code: '#N/A' })
    expect(calc('=RECHERCHEX("C003";A1:A3;B1:B3)', cells)).toBe(30)
    expect(calc('=RECHERCHEX("X";A1:A3;B1:B3;"absent")', cells)).toBe('absent')
    expect(calc('=INDEX(B1:B3;EQUIV("C002";A1:A3;0))', cells)).toBe(20)
    const bareme = { A1: 0, A2: 25, A3: 60, B1: 1.5, B2: 1, B3: 1.2 }
    expect(calc('=RECHERCHEV(30;A1:B3;2;VRAI)', bareme)).toBe(1)
  })

  it('mathématiques financières (valeurs Excel de référence)', () => {
    expect(calc('=VPM(5%/12;240;200000)') as number).toBeCloseTo(-1319.91, 2)
    expect(calc('=VC(3%;10;0;-1000)') as number).toBeCloseTo(1343.92, 2)
    expect(calc('=VA(4%;5;-1000)') as number).toBeCloseTo(4451.82, 2)
    expect(calc('=NPM(1%;-500;10000)') as number).toBeCloseTo(22.43, 2)
    expect(calc('=TAUX(60;-200;10000)') as number).toBeCloseTo(0.006183, 5)
    expect(calc('=INTPER(5%/12;1;240;200000)') as number).toBeCloseTo(-833.33, 2)
    expect(calc('=PRINCPER(5%/12;1;240;200000)') as number).toBeCloseTo(-486.58, 2)
    expect(calc('=VAN(10%;A1:A3)', { A1: 100, A2: 100, A3: 100 }) as number).toBeCloseTo(248.69, 2)
    expect(calc('=TRI(A1:A4)', { A1: -1000, A2: 400, A3: 400, A4: 400 }) as number).toBeCloseTo(0.09701, 4)
    expect(calc('=SOMMEPROD(A1:A2;B1:B2)', { A1: 2, A2: 3, B1: 4, B2: 5 })).toBe(23)
  })

  it('recopie avec références relatives et absolues', () => {
    const s = new SheetModel({ A1: 10, A2: 20, B1: 2 })
    const c = compile('=A1*$B$1')
    if (!('ast' in c)) throw new Error()
    s.set('C2', '=A1*$B$1', { dc: 0, dr: 1 })
    expect(s.get('C2')).toBe(40)
    expect(formulaToString(c.ast, { dc: 0, dr: 1 })).toBe('A2*$B$1')
  })

  it('erreurs de syntaxe et fonctions utilisées', () => {
    expect('error' in compile('=SOMME(A1:A3')).toBe(true)
    expect(isError(calc('=FOO(1)'))).toBe(true)
    expect(usedFunctions('=SIERREUR(VLOOKUP(A1,B1:C3,2,0),0)')).toEqual(['SIERREUR', 'RECHERCHEV'])
  })
})
