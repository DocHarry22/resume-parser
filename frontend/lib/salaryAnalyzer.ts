export const SALARY_CURRENCIES = ['ZAR','USD','EUR','GBP','CAD','AUD'] as const;
export type SalaryCurrency = typeof SALARY_CURRENCIES[number];
export type SalaryPeriod = 'monthly'|'annual'|'weekly'|'fortnightly'|'hourly';
export type SalaryTaxMode = 'gross'|'manual'|'za2027';
export type SalaryAge = 'under65'|'65to74'|'75plus';
export interface SalaryInput {
  label: string; currency: SalaryCurrency; amount: number; period: SalaryPeriod; hoursPerWeek: number; annualBonus: number;
  taxMode: SalaryTaxMode; age: SalaryAge; uif: boolean; monthlyDeductions: number; monthlyWorkCosts: number;
  jobId: string; advertisedSalary: string; notes: string;
}
export interface SalaryScenario extends SalaryInput { id: string; revision: string; createdAt: string; updatedAt: string }
export const SALARY_STORAGE_KEY = 'resume-studio.salary-scenarios.v1';
export const SALARY_SOURCES = {
  tax: 'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/',
  uif: 'https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/',
};
export const SALARY_TAX_YEAR = '2026/27 (1 March 2026–28 February 2027)';
export const salaryDefaults: SalaryInput = { label:'',currency:'ZAR',amount:0,period:'monthly',hoursPerWeek:40,annualBonus:0,taxMode:'gross',age:'under65',uif:true,monthlyDeductions:0,monthlyWorkCosts:0,jobId:'',advertisedSalary:'',notes:'' };
const round = (value: number) => Math.round((value+Number.EPSILON)*100)/100;
const enumHas = (values: readonly string[],value: unknown) => typeof value === 'string' && values.includes(value);
export function validateSalaryInput(value: unknown): SalaryInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Enter a valid salary scenario.');
  const item = value as SalaryInput;
  for (const [field,max] of Object.entries({label:150,jobId:200,advertisedSalary:200,notes:3000})) if (typeof item[field as keyof SalaryInput] !== 'string' || (item[field as keyof SalaryInput] as string).length > max) throw new Error('The scenario contains invalid or oversized details.');
  if (!item.label.trim()) throw new Error('Give this scenario a name.');
  if (!enumHas(SALARY_CURRENCIES,item.currency) || !enumHas(['monthly','annual','weekly','fortnightly','hourly'],item.period) || !enumHas(['gross','manual','za2027'],item.taxMode) || !enumHas(['under65','65to74','75plus'],item.age) || typeof item.uif !== 'boolean') throw new Error('Review the currency, pay period and deduction settings.');
  for (const key of ['amount','annualBonus','monthlyDeductions','monthlyWorkCosts','hoursPerWeek'] as const) if (typeof item[key] !== 'number' || !Number.isFinite(item[key]) || item[key] < 0 || item[key] > (key === 'hoursPerWeek' ? 168 : 999999999) || Math.abs(round(item[key])-item[key]) > 0.0000001) throw new Error('Enter non-negative amounts with up to two decimal places.');
  if (item.hoursPerWeek < 1) throw new Error('Weekly hours must be between 1 and 168.');
  if (item.taxMode === 'za2027' && item.currency !== 'ZAR') throw new Error('The South African tax estimate requires ZAR. Choose manual deductions for another currency.');
  const factors = {monthly:12,annual:1,weekly:52,fortnightly:26,hourly:52*item.hoursPerWeek};
  if (item.amount*factors[item.period]+item.annualBonus > 999999999) throw new Error('This scenario exceeds the supported annual amount.');
  return {label:item.label.trim(),currency:item.currency,amount:item.amount,period:item.period,hoursPerWeek:item.hoursPerWeek,annualBonus:item.annualBonus,taxMode:item.taxMode,age:item.age,uif:item.uif,monthlyDeductions:item.monthlyDeductions,monthlyWorkCosts:item.monthlyWorkCosts,jobId:item.jobId,advertisedSalary:item.advertisedSalary,notes:item.notes};
}

/** SARS 2027 annual individual rates; no medical credits or retirement adjustments. */
export function southAfricanIncomeTax(annualTaxable: number, age: SalaryAge): number {
  if (!Number.isFinite(annualTaxable) || annualTaxable < 0 || !enumHas(['under65','65to74','75plus'],age)) throw new Error('Invalid taxable income or age group.');
  const brackets = [{from:1878600,base:666339,rate:.45},{from:887000,base:259783,rate:.41},{from:695800,base:185215,rate:.39},{from:530200,base:125599,rate:.36},{from:383100,base:79998,rate:.31},{from:245100,base:44118,rate:.26},{from:0,base:0,rate:.18}];
  const bracket = brackets.find(item=>annualTaxable >= item.from)!;
  const rebate = 17820+(age !== 'under65' ? 9765:0)+(age === '75plus' ? 3249:0);
  return round(Math.max(0,bracket.base+(annualTaxable-bracket.from)*bracket.rate-rebate));
}
export function calculateSalary(value: SalaryInput) {
  const item=validateSalaryInput(value),factors={monthly:12,annual:1,weekly:52,fortnightly:26,hourly:item.hoursPerWeek*52};
  const annualBase=round(item.amount*factors[item.period]),annualGross=round(annualBase+item.annualBonus),monthlyGross=round(annualGross/12);
  const annualTax=item.taxMode === 'za2027' ? southAfricanIncomeTax(annualGross,item.age):null;
  // Even base pay over 12 months; the annual bonus is paid in one month.
  const monthlyUIF=(cash:number)=>round(Math.min(cash,17712)*.01);
  const annualUIF=item.taxMode === 'za2027' ? item.uif ? round(monthlyUIF(annualBase/12)*11+monthlyUIF(annualBase/12+item.annualBonus)):0:null;
  const annualDeductions=item.taxMode === 'gross' ? null:round((annualTax||0)+(annualUIF||0)+item.monthlyDeductions*12);
  const annualNet=annualDeductions === null ? null:round(annualGross-annualDeductions);
  return {annualBase,annualGross,monthlyGross,annualTax,annualUIF,annualDeductions,annualNet,monthlyNet:annualNet === null ? null:round(annualNet/12),monthlyAfterCosts:annualNet === null ? null:round(annualNet/12-item.monthlyWorkCosts)};
}
export function salaryDifference(value: SalaryInput,baseline: SalaryInput) {
  if (value.currency !== baseline.currency) return null;
  const a=calculateSalary(value),b=calculateSalary(baseline),amount=round(a.annualGross-b.annualGross);
  return {amount,percent:b.annualGross > 0 ? round(amount/b.annualGross*100):null};
}
export function readSalaryScenarios(): SalaryScenario[] {
  const raw:unknown=JSON.parse(localStorage.getItem(SALARY_STORAGE_KEY)||'[]');
  if (!Array.isArray(raw)||raw.length>20) throw new Error('Salary scenarios could not be read. Existing data has been kept.');
  const ids=new Set<string>();
  return raw.map(value=>{
    const item=value as SalaryScenario;
    if (!item||typeof item.id!=='string'||!item.id||item.id.length>200||ids.has(item.id)||typeof item.revision!=='string'||!item.revision||item.revision.length>200||typeof item.createdAt!=='string'||typeof item.updatedAt!=='string'||!Number.isFinite(Date.parse(item.createdAt))||!Number.isFinite(Date.parse(item.updatedAt))) throw new Error('Salary scenarios could not be read. Existing data has been kept.');
    ids.add(item.id);return {...validateSalaryInput(item),id:item.id,revision:item.revision,createdAt:item.createdAt,updatedAt:item.updatedAt};
  });
}
function storeSalary(items: SalaryScenario[]) {localStorage.setItem(SALARY_STORAGE_KEY,JSON.stringify(items));window.dispatchEvent(new Event('salary-scenarios-change'));}
export function saveSalaryScenario(input: SalaryInput,id='',expected=''): SalaryScenario {
  const value=validateSalaryInput(input),items=readSalaryScenarios(),previous=items.find(item=>item.id===id);
  if (id&&(!previous||previous.revision!==expected)) throw new Error('This scenario changed in another tab. Your edits are kept. Open its latest saved version before replacing it.');
  if (!id&&items.length>=20) throw new Error('You have 20 scenarios. Remove one before adding another.');
  const now=new Date().toISOString(),item={...value,id:previous?.id||crypto.randomUUID(),revision:crypto.randomUUID(),createdAt:previous?.createdAt||now,updatedAt:now};
  storeSalary(previous?items.map(current=>current.id===id?item:current):[...items,item]);return item;
}
export function removeSalaryScenario(id: string,expected: string) {
  const items=readSalaryScenarios(),item=items.find(item=>item.id===id);
  if (!item||item.revision!==expected) throw new Error('This scenario changed in another tab. Review its latest saved version.');
  storeSalary(items.filter(item=>item.id!==id));
}
export function salaryCsv(items: SalaryScenario[]) {
  const cell=(value:string|number|null)=>{let result=value===null?'':String(value);if(typeof value==='string'&&/^[\s]*[=+\-@]/.test(result))result="'"+result;return '"'+result.replace(/"/g,'""')+'"';};
  const rows:(string|number|null)[][]=[['Scenario','Currency','Annual base','Annual bonus','Annual gross','Annual tax estimate','Annual employee UIF','Annual total deductions','Annual take-home estimate','Monthly take-home average','Monthly work costs','Monthly after work costs','Deduction mode','Tax year','Advertised salary','Notes']];
  items.forEach(item=>{const result=calculateSalary(item);rows.push([item.label,item.currency,result.annualBase,item.annualBonus,result.annualGross,result.annualTax,result.annualUIF,result.annualDeductions,result.annualNet,result.monthlyNet,item.monthlyWorkCosts,result.monthlyAfterCosts,item.taxMode,item.taxMode==='za2027'?SALARY_TAX_YEAR:'',item.advertisedSalary,item.notes]);});
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
