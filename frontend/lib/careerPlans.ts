export type PlanTaskStatus = 'todo'|'doing'|'done';
export interface PlanDetails { title:string; goal:string; startDate:string; jobId:string; outcomes:[string,string,string] }
export interface PlanTaskInput { title:string; notes:string; day:number; status:PlanTaskStatus }
export interface PlanTask extends PlanTaskInput { id:string; revision:string }
export interface CareerPlan extends PlanDetails { id:string; revision:string; detailsRevision:string; createdAt:string; updatedAt:string; tasks:PlanTask[] }
export type PlanTemplate = 'blank'|'job-search'|'first-90-days';
export const CAREER_PLANS_KEY = 'resume-studio.career-plans.v1';
export const PLAN_PHASES = ['Days 1–30','Days 31–60','Days 61–90'];
export function validPlanDate(value:unknown):value is string {
  if(typeof value!=='string'||!/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(`${value}T00:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function planDate(start:string,offset:number) {
  if(!validPlanDate(start)||!Number.isInteger(offset)||offset<0||offset>90)throw new Error('Choose a valid start date and day.');
  const date=new Date(`${start}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);
}
export function validatePlanDetails(value:unknown):PlanDetails {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Enter valid plan details.');
  const item=value as PlanDetails;
  if(typeof item.title!=='string'||!item.title.trim()||item.title.length>150||typeof item.goal!=='string'||item.goal.length>3000||typeof item.jobId!=='string'||item.jobId.length>200||!validPlanDate(item.startDate)||planDate(item.startDate,89)>'2199-12-31'||!Array.isArray(item.outcomes)||item.outcomes.length!==3||item.outcomes.some(outcome=>typeof outcome!=='string'||outcome.length>500))throw new Error('Review the plan name, start date and three milestone outcomes.');
  return {title:item.title.trim(),goal:item.goal.trim(),startDate:item.startDate,jobId:item.jobId,outcomes:[item.outcomes[0].trim(),item.outcomes[1].trim(),item.outcomes[2].trim()]};
}
export function validatePlanTask(value:unknown):PlanTaskInput {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Enter a valid task.');
  const item=value as PlanTaskInput;
  if(typeof item.title!=='string'||!item.title.trim()||item.title.length>200||typeof item.notes!=='string'||item.notes.length>3000||!Number.isInteger(item.day)||item.day<1||item.day>90||!['todo','doing','done'].includes(item.status))throw new Error('Give the task a name, a day from 1 to 90 and a valid status.');
  return {title:item.title.trim(),notes:item.notes.trim(),day:item.day,status:item.status};
}
const identity=(value:unknown)=>typeof value==='string'&&value.length>0&&value.length<=200;
export function validateCareerPlans(raw:unknown):CareerPlan[] {
  if(!Array.isArray(raw)||raw.length>10)throw new Error('Choose a valid backup containing up to 10 plans.');
  const ids=new Set<string>();
  return raw.map(value=>{
    const item=value as CareerPlan;
    if(!item||!identity(item.id)||ids.has(item.id)||!identity(item.revision)||!identity(item.detailsRevision)||typeof item.createdAt!=='string'||typeof item.updatedAt!=='string'||!Number.isFinite(Date.parse(item.createdAt))||!Number.isFinite(Date.parse(item.updatedAt))||!Array.isArray(item.tasks)||item.tasks.length>100)throw new Error('The plan library contains invalid or duplicate records.');
    ids.add(item.id);const taskIds=new Set<string>();
    const tasks=item.tasks.map(task=>{if(!task||!identity(task.id)||!identity(task.revision)||taskIds.has(task.id))throw new Error('The plan contains invalid or duplicate tasks.');taskIds.add(task.id);return {...validatePlanTask(task),id:task.id,revision:task.revision};});
    return {...validatePlanDetails(item),id:item.id,revision:item.revision,detailsRevision:item.detailsRevision,createdAt:item.createdAt,updatedAt:item.updatedAt,tasks};
  });
}
export function readCareerPlans() {return validateCareerPlans(JSON.parse(localStorage.getItem(CAREER_PLANS_KEY)||'[]'));}
function store(items:CareerPlan[]) {const checked=validateCareerPlans(items);localStorage.setItem(CAREER_PLANS_KEY,JSON.stringify(checked));window.dispatchEvent(new Event('career-plans-change'));}
function current(id:string) {const items=readCareerPlans(),plan=items.find(item=>item.id===id);if(!plan)throw new Error('This plan is no longer saved.');return {items,plan};}
function replace(items:CareerPlan[],plan:CareerPlan) {const next={...plan,revision:crypto.randomUUID(),updatedAt:new Date().toISOString()};store(items.map(item=>item.id===next.id?next:item));return next;}
export const PLAN_TEMPLATES:Record<PlanTemplate,{name:string;outcomes:[string,string,string];tasks:[number,string][]}>={
  blank:{name:'Blank plan',outcomes:['','',''],tasks:[]},
  'job-search':{name:'Job search',outcomes:['Clarify my target roles and prepare my documents.','Build a focused application pipeline and prepare my stories.','Review opportunities and choose my next steps.'],tasks:[[3,'Clarify my target roles and priorities'],[7,'Review my resume and core experience'],[14,'Build a shortlist of employers'],[24,'Tailor an application for a selected opportunity'],[35,'Prepare examples using the STAR structure'],[42,'Review applications and follow up where appropriate'],[51,'Refine my resume using feedback'],[59,'Practice an interview conversation'],[65,'Compare the details of any offers'],[74,'Prepare questions about the role and package'],[83,'Review what I learned during my search'],[90,'Choose and record my next steps']]},
  'first-90-days':{name:'First 90 days in a role',outcomes:['Understand the team, role and expectations.','Contribute to a meaningful piece of work.','Review progress and agree the next priorities.'],tasks:[[3,'Clarify expectations with my manager'],[10,'Meet key colleagues and stakeholders'],[20,'Understand the team’s workflows and tools'],[30,'Agree the first priorities and success measures'],[37,'Choose a useful early contribution'],[45,'Gather feedback on my approach'],[52,'Document what I have learned'],[60,'Review my first contribution'],[68,'Identify improvements with the team'],[76,'Discuss my development priorities'],[85,'Prepare a progress review'],[90,'Agree the next quarter’s priorities']]},
};
export function createCareerPlan(input:PlanDetails,template:PlanTemplate):CareerPlan {
  const details=validatePlanDetails(input),items=readCareerPlans();
  if(!Object.prototype.hasOwnProperty.call(PLAN_TEMPLATES,template))throw new Error('Choose a supported starter plan.');
  if(items.length>=10)throw new Error('You have 10 plans. Remove one before creating another.');
  const now=new Date().toISOString(),preset=PLAN_TEMPLATES[template];
  const plan:CareerPlan={...details,id:crypto.randomUUID(),revision:crypto.randomUUID(),detailsRevision:crypto.randomUUID(),createdAt:now,updatedAt:now,outcomes:details.outcomes.some(Boolean)?details.outcomes:preset.outcomes.slice() as [string,string,string],tasks:preset.tasks.map(([day,title])=>({id:crypto.randomUUID(),revision:crypto.randomUUID(),title,notes:'',day,status:'todo'}))};
  store([...items,plan]);return plan;
}
export function saveCareerPlanDetails(id:string,expected:string,input:PlanDetails) {
  const details=validatePlanDetails(input),{items,plan}=current(id);
  if(plan.detailsRevision!==expected)throw new Error('The plan details changed in another tab. Your edits are kept; reopen the latest details before saving.');
  return replace(items,{...plan,...details,detailsRevision:crypto.randomUUID()});
}
export function saveCareerPlanTask(planId:string,input:PlanTaskInput,id='',expected='') {
  const value=validatePlanTask(input),{items,plan}=current(planId),previous=plan.tasks.find(task=>task.id===id);
  if(id&&(!previous||previous.revision!==expected))throw new Error('This task changed in another tab. Your edits are kept; reopen the latest task before saving.');
  if(!id&&plan.tasks.length>=100)throw new Error('This plan has 100 tasks. Remove one before adding another.');
  const task={...value,id:previous?.id||crypto.randomUUID(),revision:crypto.randomUUID()};
  return replace(items,{...plan,tasks:previous?plan.tasks.map(item=>item.id===id?task:item):[...plan.tasks,task]});
}
export function setCareerTaskStatus(planId:string,id:string,expected:string,status:PlanTaskStatus) {
  const {plan}=current(planId),task=plan.tasks.find(item=>item.id===id);
  if(!task||task.revision!==expected)throw new Error('This task changed in another tab. Review its latest status.');
  return saveCareerPlanTask(planId,{...task,status},id,expected);
}
export function removeCareerPlanTask(planId:string,id:string,expected:string) {
  const {items,plan}=current(planId),task=plan.tasks.find(item=>item.id===id);
  if(!task||task.revision!==expected)throw new Error('This task changed in another tab. Review its latest version.');
  return replace(items,{...plan,tasks:plan.tasks.filter(task=>task.id!==id)});
}
export function removeCareerPlan(id:string,expected:string) {
  const {items,plan}=current(id);if(plan.revision!==expected)throw new Error('This plan changed in another tab. Review the latest plan before removing it.');store(items.filter(item=>item.id!==id));
}
export function careerPlanProgress(plan:CareerPlan,today:string) {
  if(!validPlanDate(today))throw new Error('Invalid current date.');
  const done=plan.tasks.filter(task=>task.status==='done').length,elapsed=Math.floor((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${plan.startDate}T00:00:00Z`))/86400000)+1;
  return {done,total:plan.tasks.length,percent:plan.tasks.length?Math.round(done/plan.tasks.length*100):0,due:plan.tasks.filter(task=>task.status!=='done'&&planDate(plan.startDate,task.day-1)<=today).length,day:Math.max(1,Math.min(90,elapsed)),state:elapsed<1?'upcoming':elapsed>90?'ended':'active'};
}
export function careerPlansBackup(items:CareerPlan[]) {return JSON.stringify({format:'careerforge.career-plans',version:1,exportedAt:new Date().toISOString(),plans:validateCareerPlans(items)},null,2);}
function backupPlans(value:unknown) {const raw=value as {format?:string;version?:number;plans?:unknown};if(!raw||raw.format!=='careerforge.career-plans'||raw.version!==1)throw new Error('Choose a CareerForge 90-day plan backup.');return validateCareerPlans(raw.plans);}
export function importCareerPlans(value:unknown):CareerPlan[] {
  const imported=backupPlans(value),items=readCareerPlans();if(!imported.length)throw new Error('This backup has no plans.');if(items.length+imported.length>10)throw new Error('Import would exceed the limit of 10 plans. Existing plans have been kept.');
  const now=new Date().toISOString(),copies=imported.map(plan=>({...plan,id:crypto.randomUUID(),revision:crypto.randomUUID(),detailsRevision:crypto.randomUUID(),title:`${plan.title} (imported)`.slice(0,150),createdAt:now,updatedAt:now,tasks:plan.tasks.map(task=>({...task,id:crypto.randomUUID(),revision:crypto.randomUUID()}))}));store([...items,...copies]);return copies;
}
export function recoverCareerPlans(value:unknown,expectedRaw:string) {
  const plans=backupPlans(value);if(!plans.length)throw new Error('Choose a backup with at least one plan.');if((localStorage.getItem(CAREER_PLANS_KEY)||'')!==expectedRaw)throw new Error('The plan library changed in another tab. Review it before recovery.');store(plans);return plans;
}
export function careerPlanText(plan:CareerPlan) {
  const checked=validateCareerPlans([plan])[0],lines=[checked.title,`90 days: ${checked.startDate} to ${planDate(checked.startDate,89)}`,checked.goal,''];
  for(let phase=0;phase<3;phase++){lines.push(PLAN_PHASES[phase],checked.outcomes[phase]||'Outcome not set');checked.tasks.filter(task=>Math.ceil(task.day/30)===phase+1).sort((a,b)=>a.day-b.day).forEach(task=>{lines.push(`[${task.status==='done'?'x':task.status==='doing'?'>':' '}] Day ${task.day} (${planDate(checked.startDate,task.day-1)}) — ${task.title}`);if(task.notes)lines.push(`    ${task.notes.replace(/\n/g,'\n    ')}`);});lines.push('');}return lines.join('\n');
}
