const { clickResumeAction } = require("../../scripts/playwright-runtime.cjs");
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
// Run against the local-mode frontend and its real document processing service.
const runtime = path.resolve(__dirname, '../../.runtime/playwright-temp');
fs.mkdirSync(runtime, {recursive:true});
process.env.TEMP = process.env.TMP = runtime;
const { chromium, browserChannel } = require('../../scripts/playwright-runtime.cjs');
const out = path.resolve(__dirname, '../../docs/qa/workflow-audit');
fs.mkdirSync(out, {recursive:true});
const reportPath = path.join(out, process.env.QA_REPORT || 'button-probes.json');
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const results = [];
(async () => {
 const browser = await chromium.launch({channel:browserChannel,headless:true});
 const fixtures = await browser.newContext();
 try {
  const health=await fixtures.request.get(base+'/api/health');assert.equal(health.status(),200);assert.equal((await health.json()).storage_mode,'local','Use the browser-local preview for these tests.');
  const resume={title:'Workflow fixture',contact:{full_name:'CURRENT UNSAVED EXPORT',email:'local-qa@example.test'},summary:{summary:''},experience:[],education:[],skills:[],projects:[],certifications:[],languages:[],achievements:[],volunteer:[],publications:[],custom_sections:{}};
  const document={id:require('node:crypto').randomUUID(),resume,template:'modern',colorTheme:'blue',updatedAt:new Date().toISOString(),design:{font:'sans',fontSize:12,lineHeight:1.5,spacing:24,pageSize:'A4',sectionOrder:['summary','experience','education','skills','projects','certifications','languages','achievements','volunteer','publications','custom'],hiddenSections:[]}};
  fs.writeFileSync(path.join(out,'resume-fixture.json'),JSON.stringify(document));
  for(const format of ['pdf','docx']){const response=await fixtures.request.post(base+'/api/exports/resume/'+format,{data:resume});assert.equal(response.status(),200);fs.writeFileSync(path.join(out,'resume-fixture.'+format),await response.body());}
 } finally { await fixtures.close(); }
 const run = async (name, task) => {
  if(process.env.CASE_FILTER && !new RegExp(process.env.CASE_FILTER).test(name))return;
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page = await context.newPage(); page.setDefaultTimeout(25000); page.setDefaultNavigationTimeout(120000);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try { await task(page,context); assert.deepEqual(errors,[]); results.push({name,status:'passed'}); console.log('PASS',name); }
  catch(error) { results.push({name,status:'failed',error:error.message}); console.log('FAIL',name,error.message.slice(0,400)); await page.screenshot({path:path.join(out, name.replace(/[^a-z0-9]+/gi,'-')+'.png')}).catch(()=>{}); }
  finally { await context.close(); fs.writeFileSync(reportPath,JSON.stringify(results,null,2)); }
 };
 const go = async(page,url)=>{await page.goto(base+url,{waitUntil:'networkidle'});};
 const save = page=>page.getByRole('button',{name:'Save',exact:true}).click();
 await run('builder new from current editor',async page=>{
  await go(page,'/builder?new=1');await page.getByLabel(/^Full Name/).fill('Preserve original candidate');await save(page);
  const old=await page.evaluate(()=>new URLSearchParams(location.search).get('id'));
  await page.locator('.home-header').getByRole('link',{name:'Create my resume',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('input[placeholder="John Doe"]')?.value==='',{},{timeout:4000});
  assert.notEqual(new URL(page.url()).searchParams.get('id'),old);
 });
 await run('builder template navigation from current editor',async page=>{
  await go(page,'/builder?new=1');await page.getByLabel(/^Full Name/).fill('Template navigation candidate');await save(page);
  await page.locator('.home-header').getByRole('button',{name:'Resume Templates',exact:true}).click();
  await page.locator('.home-nav-dropdown').getByRole('link',{name:/Professional/}).click();
  await page.waitForFunction(()=>document.querySelector('.resume-document')?.dataset.template==='professional',{},{timeout:4000});
  assert.equal(await page.getByLabel(/^Full Name/).inputValue(),'Template navigation candidate');
 });
 await run('resume immediate navigation preserves last edit',async page=>{
  await go(page,'/builder?new=1'); await save(page);
  const id=new URL(page.url()).searchParams.get('id');
  await page.getByLabel(/^Full Name/).fill('Immediate navigation candidate');
  await page.locator('.home-header').getByRole('link',{name:'CareerForge home',exact:true}).click();
  await page.locator('#home-headline').waitFor();
  const value=await page.evaluate(id=>JSON.parse(localStorage.getItem('resume_studio_documents_v1')||'[]').find(d=>d.id===id)?.resume.contact.full_name,id);
  assert.equal(value,'Immediate navigation candidate');
 });
 await run('cover letter immediate return preserves draft',async page=>{
  await go(page,'/cover-letter');await page.locator('main[data-letter-ready=true]').waitFor();await page.getByRole('button',{name:'Create cover letter',exact:true}).click();
  await page.getByRole('button',{name:'Your Information',exact:true}).click();await page.getByLabel('full name',{exact:true}).fill('Immediate letter candidate');
  await page.getByRole('button',{name:'All cover letters',exact:false}).click();
  await page.getByRole('button',{name:'Create cover letter',exact:true}).click();await page.getByRole('button',{name:'Your Information',exact:true}).click();
  assert.equal(await page.getByLabel('full name',{exact:true}).inputValue(),'Immediate letter candidate');
 });
 await run('checker change file button is clickable',async page=>{
  await go(page,'/resume-scanner');await page.locator('#scanner-upload input[type=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nSynthetic fixture')});
  await page.getByRole('button',{name:'Choose a different file',exact:true}).click({timeout:4000});
  assert.equal(await page.getByRole('button',{name:'Choose a different file',exact:true}).count(),0);
 });
 await run('checker rejects unsupported DOC',async page=>{
  await go(page,'/resume-scanner');await page.locator('#scanner-upload input[type=file]').setInputFiles({name:'legacy.doc',mimeType:'application/msword',buffer:Buffer.from('Unsupported binary document')});
  await page.getByText('Please upload a PDF or DOCX file',{exact:true}).waitFor({timeout:4000});
  assert.ok(await page.getByRole('button',{name:'Scan Resume',exact:true}).isDisabled());
 });
 await run('checker rejects mismatched file extension',async page=>{
  await go(page,'/resume-scanner');await page.locator('#scanner-upload input[type=file]').setInputFiles({name:'not-a-resume.exe',mimeType:'application/pdf',buffer:Buffer.from('Unsupported input')});
  await page.getByText('Please upload a PDF or DOCX file',{exact:true}).waitFor({timeout:4000});
 });
 await run('every template filter and preview works',async page=>{
  await go(page,'/templates');for(const [label,count] of [['All',8],['Modern',2],['Professional',2],['Classic',2],['Minimal',1],['Creative',1]]){await page.getByRole('button',{name:label,exact:true}).click();assert.equal(await page.locator('.template-card').count(),count);}
  await page.getByRole('button',{name:'All',exact:true}).click();
  const links=await page.locator('.template-preview-link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  for(const href of links){await go(page,href);assert.equal(await page.locator('.resume-document').getAttribute('data-template'),new URL(base+href).searchParams.get('template'));}
 });
 await run('builder design toolbar help undo redo and print',async page=>{
  await go(page,'/builder?new=1');await clickResumeAction(page, "Editor help");await page.getByRole('dialog',{name:'Editor help'}).waitFor();await page.getByRole('button',{name:'Done',exact:true}).click();
  await page.getByLabel(/^Full Name/).fill('Undo redo candidate');await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await page.getByLabel(/^Full Name/).inputValue(),'');await page.getByRole('button',{name:'Redo',exact:true}).click();assert.equal(await page.getByLabel(/^Full Name/).inputValue(),'Undo redo candidate');
  await page.getByRole('button',{name:'Design & sections',exact:true}).click();await page.getByLabel('Font',{exact:true}).selectOption('serif');await page.getByLabel('Paper',{exact:true}).selectOption('Letter');await page.getByLabel('Show Professional summary',{exact:true}).uncheck();await page.getByRole('button',{name:'Move Education up',exact:true}).click();
  await page.getByRole('button',{name:'Choose template & color',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Choose resume template'});
  for(const color of ['Blue','Green','Purple','Red','Orange','Teal','Gray','Indigo']) await dialog.getByRole('button',{name:color,exact:true}).click();
  for(const name of ['Modern','Classic','Minimal','Professional','Creative','Executive','Technical','Elegant']) await dialog.getByRole('button',{name:new RegExp('^'+name+' ')}).click();
  await dialog.getByRole('button',{name:'Apply Changes',exact:true}).click();assert.equal(await page.locator('.resume-document').getAttribute('data-template'),'elegant');
  await page.evaluate(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++;});await clickResumeAction(page, "Print / Save PDF");assert.equal(await page.evaluate(()=>window.__printCalls),1);
 });
 await run('homepage all controls and internal link targets',async(page,context)=>{
  await go(page,'/');for(const menu of ['Resume Templates','Resume Examples','Cover Letter','Resources']){await page.locator('.home-header').getByRole('button',{name:menu,exact:true}).click();assert.ok(await page.locator('.home-nav-dropdown').isVisible());await page.keyboard.press('Escape');}
  for(const tab of await page.getByRole('tab').all()){await tab.click();assert.ok(await page.getByRole('tabpanel').isVisible());}
  for(const role of await page.locator('.home-role-options button').all())await role.click();for(const summary of await page.locator('#faq summary').all()){await summary.click();await summary.click();}
  for(const category of ['All','Modern','Professional','Classic','Minimal','Creative'])await page.locator('#templates').getByRole('button',{name:category,exact:true}).click();await page.locator('#templates').getByRole('button',{name:'All',exact:true}).click();await page.getByRole('button',{name:'Next templates',exact:true}).click();await page.getByRole('button',{name:'Previous templates',exact:true}).click();
  await page.getByRole('button',{name:'Open resume help',exact:true}).click();await page.getByRole('button',{name:'Close help',exact:true}).click();
  const links=[...new Set(await page.locator('a[href^="/"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))))];for(const href of links){const response=await context.request.get(base+href);assert.equal(response.status(),200,href);const hash=new URL(base+href).hash;if(hash)assert.ok((await response.text()).includes('id="'+hash.slice(1)+'"'),href+' missing anchor');}
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open menu',exact:true}).click();const mobile=page.getByRole('navigation',{name:'Mobile navigation',exact:true});for(const button of await mobile.getByRole('button').all()){await button.click();await button.click();}await mobile.getByRole('link',{name:'FAQ',exact:true}).click();assert.equal(await mobile.count(),0);
 });
 for (const [mode, label, extension] of [['basic','Basic','pdf'],['ats','ATS','docx'],['expert','Expert','pdf']]) {
  await run(`checker real ${mode} scan and edit handoff`,async page=>{
   await go(page,'/resume-scanner');await page.getByRole('button',{name:label,exact:true}).click();
   await page.locator('.checker-options summary').click();await page.getByLabel(/^Industry/).selectOption('engineering');
   await page.getByLabel(/^Job description/).fill('Software engineer with Python, testing, communication and project experience.');
   await page.evaluate(()=>{const original=window.fetch;window.fetch=function(url,options){if(String(url).includes('/parse-and-score')&&options?.body instanceof FormData)window.__scanFields=Object.fromEntries(options.body.entries());return original.apply(this,arguments);};});
   await page.getByLabel('Resume file',{exact:true}).setInputFiles(path.join(out,`resume-fixture.${extension}`));
   const [response]=await Promise.all([page.waitForResponse(r=>r.url().includes('/api/parse-and-score?mode='+mode)),page.getByRole('button',{name:'Scan Resume',exact:true}).click()]);
   assert.equal(response.status(),200,await response.text());const data=await response.json();assert.ok(Number.isFinite(data.score.overall));
   const fields=await page.evaluate(()=>window.__scanFields);assert.equal(fields.industry,'engineering');assert.match(fields.job_description,/Software engineer/);assert.equal(data.score.mode,mode);
   await page.getByRole('region',{name:'Resume analysis results'}).waitFor();
   if(mode==='basic') {await page.getByRole('button',{name:'Scan Another Resume',exact:true}).click();assert.equal(await page.getByRole('region',{name:'Resume analysis results'}).count(),0);await page.getByRole('button',{name:'Scan Resume',exact:true}).click();}
   await page.getByRole('button',{name:'Edit this resume',exact:true}).click();await page.getByLabel(/^Full Name/).waitFor();
   assert.equal(await page.getByLabel(/^Full Name/).inputValue(),data.resume.name||'');
  });
 }
 await run('checker empty invalid files service failure and retry',async page=>{
  await go(page,'/resume-scanner');const upload=page.getByLabel('Resume file',{exact:true});
  await upload.setInputFiles({name:'empty.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(0)});await page.getByRole('alert').filter({hasText:'This file is empty'}).waitFor();
  await upload.setInputFiles({name:'corrupt.pdf',mimeType:'application/pdf',buffer:Buffer.from('Not a PDF document')});
  const [bad]=await Promise.all([page.waitForResponse(r=>r.url().includes('/api/parse-and-score')),page.getByRole('button',{name:'Scan Resume',exact:true}).click()]);assert.ok(bad.status()>=400);await page.locator('#scanner-upload').getByRole('alert').waitFor();
  await page.getByRole('button',{name:'Choose a different file',exact:true}).click();await upload.setInputFiles(path.join(out,'resume-fixture.pdf'));
  await page.route('**/api/parse-and-score*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Temporary audit outage. Try again.'})}));
  await page.getByRole('button',{name:'Scan Resume',exact:true}).click();await page.getByRole('alert').filter({hasText:'Temporary audit outage'}).waitFor();
  await page.unroute('**/api/parse-and-score*');await page.getByRole('button',{name:'Scan Resume',exact:true}).click();await page.getByRole('region',{name:'Resume analysis results'}).waitFor();
 });
 await run('builder PDF DOCX JSON imports and invalid backup preserve documents',async page=>{
  await go(page,'/builder?new=1');await page.getByLabel(/^Full Name/).fill('Preserve before imports');await save(page);
  const original=new URL(page.url()).searchParams.get('id');const ids=[original];
  for(const extension of ['pdf','docx','json']){
   const parsed=extension==='json'?null:page.waitForResponse(response=>new URL(response.url()).pathname==='/api/exports/resume/import');
   await page.getByLabel('Import resume',{exact:true}).setInputFiles(path.join(out,`resume-fixture.${extension}`));
   await page.getByText('Resume imported into a new document.',{exact:false}).waitFor();
   await page.waitForFunction(previous=>new URLSearchParams(location.search).get('id')!==previous,ids.at(-1));
   if(parsed){const response=await parsed;assert.equal(response.status(),200);const data=await response.json();assert.equal(await page.getByLabel(/^Full Name/).inputValue(),data.resume.contact.full_name);assert.equal(await page.getByLabel(/^Email/).inputValue(),'local-qa@example.test');}
   else assert.match(await page.getByLabel(/^Full Name/).inputValue(),/CURRENT UNSAVED EXPORT/);
   ids.push(new URL(page.url()).searchParams.get('id'));
   await page.reload({waitUntil:'networkidle'});
  }
  assert.equal(new Set(ids).size,4);
  await page.getByLabel('Import resume',{exact:true}).setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"not":"a resume"}')});
  await page.getByRole('alert').filter({hasText:/backup|resume|document/i}).waitFor();assert.match(await page.getByLabel(/^Full Name/).inputValue(),/CURRENT UNSAVED EXPORT/);
  assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('resume_studio_documents_v1')).find(d=>d.id===id).resume.contact.full_name,original),'Preserve before imports');
 });
 await run('builder photo duplicate delete and repeated new navigation',async page=>{
  await go(page,'/builder?new=1');await page.getByLabel(/^Full Name/).fill('Photo candidate');
  await page.locator('input[type=file][accept^="image/"]').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2KAAAAABJRU5ErkJggg==','base64')});
  await page.getByRole('img',{name:'Profile',exact:true}).first().waitFor();await page.reload({waitUntil:'networkidle'});await page.getByRole('img',{name:'Profile',exact:true}).first().waitFor();
  await page.getByRole('button',{name:'Remove profile photo',exact:true}).click();assert.equal(await page.getByRole('img',{name:'Profile',exact:true}).count(),0);
  await save(page);const old=new URL(page.url()).searchParams.get('id');await clickResumeAction(page, "Duplicate");
  await page.waitForFunction(id=>new URLSearchParams(location.search).get('id')!==id,old);const copy=new URL(page.url()).searchParams.get('id');
  await page.getByRole('button',{name:'Design & sections',exact:true}).click();page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete this resume from browser',exact:true}).click();
  assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('resume_studio_documents_v1')).some(d=>d.id===id),copy),false);
  assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('resume_studio_documents_v1')).find(d=>d.id===id).resume.contact.full_name,old),'Photo candidate');
  for(const name of ['One new document','Another new document']){const previous=new URL(page.url()).searchParams.get('id');await page.locator('.home-header').getByRole('link',{name:'Create my resume',exact:true}).click();await page.waitForFunction(id=>new URLSearchParams(location.search).get('id')!==id && !new URLSearchParams(location.search).has('new'),previous);await page.getByRole('button',{name:'Content',exact:true}).click();await page.getByLabel(/^Full Name/).fill(name);await save(page);}
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('resume_studio_documents_v1')).filter(d=>['One new document','Another new document'].includes(d.resume.contact.full_name)).length),2);
 });
 await run('resume storage failure retains edits and permits backup',async page=>{
  await go(page,'/builder?new=1');await save(page);await page.getByLabel(/^Full Name/).fill('Storage full candidate');
  await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='resume_studio_documents_v1')throw new DOMException('Storage is full','QuotaExceededError');return window.__setItem.call(this,key,value);};});
  await save(page);await page.getByRole('alert').filter({hasText:'Browser save failed'}).waitFor();
  await page.locator('.home-header').getByRole('link',{name:'CareerForge home',exact:true}).click();assert.ok(page.url().includes('/builder'));
  const [backup]=await Promise.all([page.waitForEvent('download'),clickResumeAction(page, "JSON backup")]);const destination=path.join(out,'storage-failure-backup.json');await backup.saveAs(destination);assert.equal(JSON.parse(fs.readFileSync(destination)).resume.contact.full_name,'Storage full candidate');
  await page.evaluate(()=>{Storage.prototype.setItem=window.__setItem;});await save(page);
 });
 await run('cover letter wizard templates tones writing ideas and preview',async page=>{
  await go(page,'/cover-letter');await page.locator('main[data-letter-ready=true]').waitFor();await page.getByRole('button',{name:'Create cover letter',exact:true}).click();
  for(const name of ['Modern','Minimal','Creative','Executive','Tech'])await page.getByRole('button',{name:new RegExp('^'+name+' ')}).click();
  for(const name of ['Enthusiastic','Confident','Friendly','Formal'])await page.getByRole('button').filter({has:page.locator('div.font-medium',{hasText:new RegExp('^'+name+'$')})}).click();
  await page.getByRole('button',{name:'Job Details',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Continue',exact:true}).isDisabled());
  await page.getByLabel('job title',{exact:true}).fill('Software Engineer');await page.getByLabel('company name',{exact:true}).fill('Example Company');await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('full name',{exact:true}).fill('Wizard QA Candidate');await page.getByLabel('email',{exact:true}).fill('wizard@example.test');await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  for(const section of ['Opening','Body','Closing']){
   await page.getByRole('button',{name:new RegExp(section+'$')}).click();await page.getByRole('button',{name:/Writing ideas/}).click();
   const dialog=page.getByRole('dialog',{name:'Writing ideas',exact:true});await dialog.waitFor();await dialog.getByRole('button',{name:/Use this/}).first().click();
  }
  await page.getByRole('button',{name:/Body$/}).click();await page.getByRole('button',{name:/Add.*Paragraph/i}).click();await page.getByLabel('Body paragraph 2',{exact:true}).fill('A second genuine example.');await page.getByRole('button',{name:'Remove body paragraph 2',exact:true}).click();
  await page.locator('.cover-letter-studio').getByRole('button',{name:'Preview & Export',exact:true}).last().click();await page.getByRole('button',{name:'Hide preview',exact:true}).click();await page.getByRole('button',{name:'Show preview',exact:true}).click();
  await page.getByRole('button',{name:'Save in browser',exact:true}).first().click();await page.getByText('Cover letter saved only in this browser on this device.',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'wizard-mobile.png'),fullPage:true});
 });
 await run('builder every content section save rich exports and multipage print',async page=>{
  await go(page,'/builder?new=1');await page.getByLabel(/^Full Name/).fill('Alex Morgan');await page.getByLabel(/^Email/).fill('alex.morgan@example.test');
  const section=value=>page.getByLabel('Editing section').selectOption(value);
  await section('summary');await page.getByLabel(/^Professional Summary/).fill('Software engineer building reliable systems with Python and TypeScript.');
  const entries=[['experience','Add Work Experience',{'Job Title':'Software Engineer','Company':'Example Company','Start Date':'2020-01'}],['education','Add Education',{'Degree':'Bachelor of Science','Institution':'Example University'}],['projects','Add Project',{'Project Name':'Accessible application','Description':'Built a useful application.'}],['certifications','Add Certification',{'Certification Name':'Quality Certificate','Issuing Organization':'Example Institute'}]];
  for(const [name,add,fields] of entries){await section(name);await page.getByRole('button',{name:add,exact:true}).click();for(const [label,value] of Object.entries(fields))await page.getByLabel(new RegExp('^'+label)).fill(value);}
  await section('skills');await page.getByPlaceholder('e.g., React, Python, Project Management').fill('Python');await page.getByRole('button',{name:'Add',exact:true}).click();
  await section('languages');await page.getByRole('button',{name:'Add Language',exact:true}).click();await page.getByPlaceholder('Language name').fill('English');
  for(const [name,label,value] of [['achievements','Achievements','Improved delivery time by 20%.'],['volunteer','Volunteering','Community mentor'],['publications','Publications','Practical engineering guide']]){await section(name);await page.getByLabel(label,{exact:true}).fill(value);}
  await section('custom');await page.getByRole('button',{name:'+ Licences',exact:true}).click();await page.getByLabel('Licences',{exact:true}).fill('Current professional licence');
  await page.getByLabel('Custom heading',{exact:true}).fill('Additional evidence');await page.getByLabel('Content',{exact:true}).fill('A useful detail.');await page.getByRole('button',{name:'Add custom section',exact:true}).click();
  await save(page);await page.reload({waitUntil:'networkidle'});const preview=await page.locator('.resume-document').innerText();for(const text of ['Alex Morgan','Example Company','Example University','Python','Accessible application','Quality Certificate','English','Improved delivery time','Community mentor','Practical engineering guide','Current professional licence','A useful detail.'])assert.ok(preview.includes(text),text);
  for(const [format,label] of [['pdf','Download PDF'],['docx','DOCX'],['txt','TXT'],['json','JSON backup']]){const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:label,exact:true}).click()]);await file.saveAs(path.join(out,'rich-resume.'+format));}
  await section('custom');await page.getByLabel('Licences',{exact:true}).fill(Array.from({length:70},(_,i)=>`Evidence ${i+1}: Delivered useful software, tested accessibility, and documented engineering decisions.`).join('\n')+'\nFINAL MULTIPAGE CONTENT SENTINEL');
  await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,'rich-resume-print.pdf'),preferCSSPageSize:true,printBackground:true});await page.emulateMedia({media:'screen'});
  await page.setViewportSize({width:390,height:844});for(const name of ['Edit','Preview']){await page.getByRole('button',{name,exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 });
 await browser.close();const failures=results.filter(r=>r.status==='failed');console.log(JSON.stringify({passed:results.length-failures.length,failed:failures.length}));if(failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
