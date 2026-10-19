(() => {
  if (!['http://127.0.0.1:3103','http://localhost:3103','http://127.0.0.1:3104','http://localhost:3104','https://resume.docheng.co.za','https://docheng-careerforge.thletsholo2.chatgpt.site'].includes(location.origin) || window.top !== window) return;
  window.addEventListener('message',event=> {
    const request = event.data;
    if (event.source !== window || event.origin !== location.origin || request?.channel !== 'careerforge-helper-request' || typeof request.requestId !== 'string' || request.requestId.length > 100 || !['PING','START','STATUS','CLEAR'].includes(request.action)) return;
    chrome.runtime.sendMessage({action:request.action,payload:request.payload},response=> {
      const error = chrome.runtime.lastError?.message || response?.error;
      window.postMessage({channel:'careerforge-helper-response',requestId:request.requestId,...(error?{error}:{result:response?.result})},location.origin);
    });
  });
})();
