(function(root) {
  'use strict';
  const normalize = value => String(value || '').toLowerCase().replace(/\((required|optional)\)/g,' ').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
  function identity(field) {
    const label = [...(field.labels || [])].map(item=>{const copy=item.cloneNode(true);copy.querySelectorAll('input,textarea,select,button').forEach(child=>child.remove());return copy.textContent;}).join(' ') || field.getAttribute('aria-label');
    return normalize(label || field.name || field.id);
  }
  function mapped(field) {
    const key = identity(field);
    const fields = { 'first name':'firstName','firstname':'firstName','last name':'lastName','lastname':'lastName','full name':'fullName','name':'fullName','email':'email','email address':'email','phone':'phone','phone number':'phone','mobile phone':'phone','location':'location','current location':'location','linkedin':'linkedin','linkedin profile':'linkedin','linkedin url':'linkedin','website':'website','personal website':'website','portfolio':'website','cover letter':'coverLetterText','coverletter':'coverLetterText' };
    return fields[key] || '';
  }
  function isResume(field) { const key = identity(field); return !/photo|image|passport|headshot/.test(key) && (/^(resume|cv)\b/.test(key) || /^(attach|upload) (resume|cv)\b/.test(key) || ['resume','cv','resumefile'].includes(normalize(field.name))); }
  function isLetter(field) { return /^(cover letter|coverletter|attach cover letter|upload cover letter)\b/.test(identity(field)) || normalize(field.name)==='cover letter'; }
  function accepts(field,file) { const accept = (field.accept || '').toLowerCase().split(',').map(item=>item.trim()).filter(Boolean); return !accept.length || accept.some(item=> item === file.type.toLowerCase() || (item.startsWith('.') && file.name.toLowerCase().endsWith(item)) || item === '*/*'); }
  async function fillReviewedApplication(packet, document) {
    const profile = { ...packet.profile,fullName:`${packet.profile.firstName} ${packet.profile.lastName}`.trim(),coverLetterText:packet.coverLetterText };
    const result = { filled:0,attachments:0,kept:0,remaining:[],notes:[] };
    for (const field of document.querySelectorAll('input,textarea,select')) {
      if (field.disabled || field.readOnly || ['hidden','password','submit','button','reset','checkbox','radio'].includes(field.type) || field.tagName === 'SELECT' || field.getAttribute('role') === 'combobox') continue;
      if (field.type === 'file') {
        const selected = isResume(field) ? packet.resume : isLetter(field) ? packet.coverLetter : undefined;
        if (!selected) continue;
        if (field.files?.length) { result.kept++; continue; }
        if (!accepts(field,selected)) { result.notes.push(`${isResume(field) ? 'Resume' : 'Cover letter'}: this form needs another file format. Upload it yourself before submitting.`); continue; }
        try { const bytes = Uint8Array.from(atob(selected.base64),c=>c.charCodeAt(0)); const transfer = new DataTransfer(); transfer.items.add(new File([bytes],selected.name,{type:selected.type})); field.files = transfer.files; field.dispatchEvent(new Event('change',{bubbles:true})); result.attachments++; } catch { result.notes.push('A document could not be attached. Upload it on the form.'); }
        continue;
      }
      if (!field.getClientRects().length) continue;
      const key = mapped(field), value = key ? profile[key] : '';
      if (!value) continue;
      if (field.value?.trim()) { result.kept++; continue; }
      const prototype = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype,'value').set.call(field,value);
      field.dispatchEvent(new Event('input',{bubbles:true})); field.dispatchEvent(new Event('change',{bubbles:true})); result.filled++;
    }
    for (const field of document.querySelectorAll('input[required],textarea[required],select[required],[aria-required="true"]')) {
      if (field.disabled || field.type === 'hidden' || (!field.getClientRects().length && field.type !== 'file')) continue;
      const empty = ['checkbox','radio'].includes(field.type) ? !field.checked : field.type === 'file' ? !field.files?.length : !field.value;
      if (empty) result.remaining.push((identity(field) || 'Required question').slice(0,120));
    }
    result.remaining = [...new Set(result.remaining)].slice(0,30);
    return result;
  }
  root.CareerForgeFill = { fillReviewedApplication,mapped,identity };
  if (typeof module !== 'undefined') module.exports = root.CareerForgeFill;
})(globalThis);
