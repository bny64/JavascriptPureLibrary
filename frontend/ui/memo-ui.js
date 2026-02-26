import { API } from '../api/api.js';
import { TextUtils } from '../utils/dom.js';

export const MemoUI = {
  async render() {
    const listEl = document.getElementById('memoList');
    if (!listEl) return;

    try {
      const memos = await API.memos.getAll();

      if (memos.length === 0) {
        listEl.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px;">등록된 메모가 없습니다.</p>';
        return;
      }

      listEl.innerHTML = memos.map(memo => `
                <div class="memo-item">
                    <div class="memo-content">${TextUtils.escapeHtml(memo.content)}</div>
                    <div class="memo-meta">
                        <span>${new Date(memo.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <button class="btn-delete-memo" onclick="window.deleteMemo('${memo.id}')">삭제</button>
                    </div>
                </div>
            `).join('');
    } catch (error) {
      console.error('Failed to render memos:', error);
    }
  },

  toggleDrawer() {
    const drawer = document.getElementById('memoDrawer');
    if (!drawer) return;

    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) {
      this.render();
    }
  },

  async addMemo() {
    const input = document.getElementById('memoInput');
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    await API.memos.create({ content });
    input.value = '';
    this.render();
  },

  async deleteMemo(id) {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    await API.memos.delete(id);
    this.render();
  }
};
