importScripts('shared.js');
const rules = CareerForgeApply;
async function start(packet) {
  packet = rules.validatePacket(packet);
  const { active } = await chrome.storage.session.get('active');
  if (active && Date.parse(active.packet.expiresAt) > Date.now()) throw new Error('One application is already being filled. Finish it or clear it in the helper before starting another.');
  // Store the reviewed packet before the employer page can ask for it.
  const tab = await chrome.tabs.create({ url:'about:blank',active:true });
  await chrome.storage.session.set({ active:{ tabId:tab.id,packet } });
  await chrome.tabs.update(tab.id,{ url:packet.url });
  return { state:'opened',id:packet.id,revision:packet.revision };
}
chrome.runtime.onMessage.addListener((message,sender,reply) => {
  (async()=> {
    const internal = sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL(''));
    const app = sender.id === chrome.runtime.id && rules.appOrigin(sender.url || '');
    if (['PING','START','STATUS','CLEAR'].includes(message.action) && !app && !internal) throw new Error('Open CareerForge or the helper popup to prepare an application.');
    if (message.action === 'PING') return { version:chrome.runtime.getManifest().version,mode:'review' };
    if (message.action === 'START') return start(message.payload);
    if (message.action === 'STATUS') { const { statuses = {} } = await chrome.storage.session.get('statuses'); return message.payload?.id ? statuses[message.payload.id] || null : Object.values(statuses).slice(-10); }
    if (message.action === 'CLEAR') { await chrome.storage.session.remove('active'); return { cleared:true }; }
    if (message.action === 'GET_PACKET') {
      const { active } = await chrome.storage.session.get('active');
      if (!active || sender.tab?.id !== active.tabId || !rules.sameTarget(sender.url || '',active.packet.url)) return null;
      return rules.validatePacket(active.packet);
    }
    if (message.action === 'REPORT') {
      const { active,statuses = {} } = await chrome.storage.session.get(['active','statuses']);
      if (!active || sender.tab?.id !== active.tabId || !rules.sameTarget(sender.url || '',active.packet.url) || message.payload?.revision !== active.packet.revision) return null;
      const data = message.payload;
      const status = { id:active.packet.id,revision:active.packet.revision,state:data.state === 'review' ? 'review' : 'error',message:String(data.message || '').slice(0,1000),filled:Number(data.filled)||0,attachments:Number(data.attachments)||0,remaining:Array.isArray(data.remaining)?data.remaining.slice(0,30).map(item=>String(item).slice(0,120)):[],at:new Date().toISOString() };
      statuses[status.id] = status;
      await chrome.storage.session.set({ statuses:Object.fromEntries(Object.entries(statuses).slice(-30)) });
      await chrome.storage.session.remove('active');
      return { recorded:true };
    }
    throw new Error('Unsupported helper action.');
  })().then(result=>reply({result})).catch(error=>reply({error:error.message || 'The application helper could not complete this action.'}));
  return true;
});
chrome.tabs.onRemoved.addListener(async tabId => { const {active} = await chrome.storage.session.get('active'); if(active?.tabId === tabId) await chrome.storage.session.remove('active'); });
