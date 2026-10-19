(async()=> {
  if (!CareerForgeApply.target(location.href)) return;
  const message = async(action,payload)=> { const response=await chrome.runtime.sendMessage({action,payload}); if(response?.error) throw new Error(response.error); return response?.result; };
  let packet;
  for(let attempt=0;attempt<15;attempt++){ packet=await message('GET_PACKET').catch(()=>null); if(packet) break; await new Promise(resolve=>setTimeout(resolve,300)); }
  if(!packet) return;
  try {
    packet=CareerForgeApply.validatePacket(packet);
    let stable=0,last=-1;
    for(let attempt=0;attempt<60;attempt++) { const count=document.querySelectorAll('input:not([type=hidden]),textarea,select').length; stable=count>1&&count===last?stable+1:0; last=count; if(stable>=3) break; await new Promise(resolve=>setTimeout(resolve,250)); }
    const form=[...document.querySelectorAll('form')].find(form=>[...form.querySelectorAll('input[type="file"]')].some(field=>/resume|cv/i.test(field.name||field.id||field.getAttribute('aria-label')||'')) || ([...form.querySelectorAll('button,input[type="submit"]')].some(button=>/submit application|apply for|send application/i.test(button.textContent||button.value||'')) && form.querySelector('input[type="email"],input[name="email"]')));
    if(!form)throw new Error('A supported application form was not found. Open the active job’s application form and prepare it again.');
    const result=await CareerForgeFill.fillReviewedApplication(packet,form);
    if(!result.filled&&!result.attachments&&!result.kept) throw new Error('No supported empty fields were found. Review and complete this form yourself.');
    const note=`${result.filled} contact fields filled; ${result.attachments} documents attached. ${result.remaining.length ? `${result.remaining.length} required questions still need your answer. ` : ''}Review the entire form and use the employer’s submit button yourself.${result.notes.length?' '+result.notes.join(' '):''}`;
    const host=document.createElement('div'); host.id='careerforge-application-review'; const shadow=host.attachShadow({mode:'closed'});
    const style=document.createElement('style'); style.textContent=':host{all:initial;position:fixed;bottom:18px;right:18px;width:min(360px,calc(100vw - 36px));z-index:2147483647}section{font:13px/1.6 system-ui,sans-serif;color:#30435a;border:1px solid #bbd9ed;background:white;box-shadow:0 8px 35px #16314b30;border-radius:12px;padding:20px}strong{font-size:15px;display:block;margin-bottom:8px;color:#167bc0}button{float:right;border:0;background:#edf6fd;color:#44799c;border-radius:5px;cursor:pointer;padding:4px 8px}p{margin:0;white-space:pre-wrap}';
    const section=document.createElement('section'),close=document.createElement('button'),title=document.createElement('strong'),copy=document.createElement('p'); close.type='button';close.textContent='×';close.setAttribute('aria-label','Dismiss CareerForge review note');close.addEventListener('click',()=>host.remove());title.textContent='Ready for your review';copy.textContent=note;section.append(close,title,copy);shadow.append(style,section);document.documentElement.append(host);
    await message('REPORT',{revision:packet.revision,state:'review',message:note,...result});
  } catch(error) { await message('REPORT',{revision:packet.revision,state:'error',message:error.message}).catch(()=>{}); }
})();
