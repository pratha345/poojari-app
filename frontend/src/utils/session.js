// Persistent anonymous session ID stored in localStorage
// Used for rating without login
export function getSessionId() {
  let sid = localStorage.getItem('pojjari_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('pojjari_session', sid);
  }
  return sid;
}
