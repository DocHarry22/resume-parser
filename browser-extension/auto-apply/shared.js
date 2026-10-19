(function(root) {
  'use strict';
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  function target(value) {
    let url; try { url = new URL(value); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const green = ['boards.greenhouse.io','job-boards.greenhouse.io','boards.eu.greenhouse.io','job-boards.eu.greenhouse.io'].includes(url.hostname), lever = ['jobs.lever.co','jobs.eu.lever.co'].includes(url.hostname);
    if (!green && !lever) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const embedded = green && parts[0] === 'embed' && ['job_app','job_board'].includes(parts[1]);
    const board = embedded ? url.searchParams.get('for') : parts[0];
    const id = embedded ? url.searchParams.get('token') || url.searchParams.get('gh_jid') : green ? parts[1] === 'jobs' ? parts[2] : '' : parts[1];
    if (!/^[a-z0-9_-]{1,100}$/i.test(board || '') || !(green ? /^\d{1,30}$/.test(id || '') : /^[a-f0-9-]{20,60}$/i.test(id || ''))) return null;
    if (!embedded && (green ? parts.length !== 3 : parts.length > 3 || (parts[2] && parts[2] !== 'apply'))) return null;
    const eu = url.hostname.includes('.eu.');
    return { provider: green ? 'greenhouse' : 'lever', board: board.toLowerCase(), id: id.toLowerCase(), eu, url: green ? `https://${eu ? 'job-boards.eu.greenhouse.io' : 'job-boards.greenhouse.io'}/${board}/jobs/${id}` : `https://${eu ? 'jobs.eu.lever.co' : 'jobs.lever.co'}/${board}/${id}/apply` };
  }
  function sameTarget(a,b) { const x = target(a), y = target(b); return !!x && !!y && x.provider === y.provider && x.board === y.board && x.id === y.id && x.eu === y.eu; }
  function appOrigin(value) { try { const url = new URL(value); return ['http://127.0.0.1:3103','http://localhost:3103','http://127.0.0.1:3104','http://localhost:3104','https://resume.docheng.co.za','https://docheng-careerforge.thletsholo2.chatgpt.site'].includes(url.origin); } catch { return false; } }
  function validatePacket(input, now = Date.now()) {
    const fail = () => { throw new Error('Choose a current, reviewed CareerForge application packet for a direct Greenhouse or Lever job.'); };
    const str = (value,max) => typeof value === 'string' && value.length <= max;
    if (!input || typeof input !== 'object' || input.format !== 'careerforge.application' || input.version !== 1 || input.reviewed !== true || input.mode !== 'review' || !str(input.id,200) || !input.id || !str(input.revision,200) || !input.revision || !str(input.role,150) || !str(input.company,150) || !str(input.url,2000) || !target(input.url) || !Number.isFinite(Date.parse(input.createdAt)) || !Number.isFinite(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) <= now || Date.parse(input.createdAt) > now + 60000 || Date.parse(input.expiresAt) - Date.parse(input.createdAt) > 31 * 60000 || now - Date.parse(input.createdAt) > 31 * 60000) fail();
    const details = input.profile, bounds = { firstName:100,lastName:100,email:254,phone:100,location:200,linkedin:500,website:500 };
    if (!details || Object.entries(bounds).some(([key,max]) => !str(details[key],max)) || !details.firstName.trim() || !details.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) fail();
    for (const value of [details.linkedin,details.website].filter(Boolean)) { let url; try { url = new URL(value); } catch { fail(); } if (!['http:','https:'].includes(url.protocol) || url.username || url.password) fail(); }
    function file(value) {
      if (!value || !str(value.name,150) || !/^[^\\/]+\.(docx|pdf)$/i.test(value.name) || ![DOCX,'application/pdf'].includes(value.type) || !str(value.base64,5600000) || !/^[a-z0-9+/]+={0,2}$/i.test(value.base64)) fail();
      let prefix; try { prefix = atob(value.base64.slice(0,16)); } catch { fail(); }
      if (value.type === DOCX ? !prefix.startsWith('PK\x03\x04') || !/\.docx$/i.test(value.name) : !prefix.startsWith('%PDF-') || !/\.pdf$/i.test(value.name)) fail();
      return { name:value.name,type:value.type,base64:value.base64 };
    }
    if (!str(input.coverLetterText,100000)) fail();
    return { format:input.format,version:1,id:input.id,revision:input.revision,createdAt:input.createdAt,expiresAt:input.expiresAt,url:target(input.url).url,role:input.role,company:input.company,profile:Object.fromEntries(Object.keys(bounds).map(key=>[key,details[key]])),reviewed:true,mode:'review',resume:file(input.resume),...(input.coverLetter ? {coverLetter:file(input.coverLetter)} : {}),coverLetterText:input.coverLetterText };
  }
  const api = { target,sameTarget,appOrigin,validatePacket }; root.CareerForgeApply = api; if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
