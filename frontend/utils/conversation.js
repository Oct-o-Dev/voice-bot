// frontend/utils/conversation.js
export function getConversationId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('simplotel_conv_id');
  if (!id) {
    id = crypto?.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem('simplotel_conv_id', id);
  }
  return id;
}
