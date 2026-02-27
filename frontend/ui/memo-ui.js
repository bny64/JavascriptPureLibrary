import { API } from '../api/api.js';
import { TextUtils } from '../utils/dom.js';

export const MemoUI = {
  async render() {
    const listEl = document.getElementById('memoList');
    const wallContainer = document.getElementById('stickyNoteContainer');
    const wallSection = document.getElementById('dashboardStickyWall');

    try {
      const memos = await API.memos.getAll();

      // 1. 드로어 리스트 렌더링
      if (listEl) {
        if (memos.length === 0) {
          listEl.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px;">등록된 메모가 없습니다.</p>';
        } else {
          listEl.innerHTML = memos.map(memo => `
                    <div class="memo-item">
                        <div class="memo-content">${TextUtils.escapeHtml(memo.content)}</div>
                        <div class="memo-meta">
                            <span>${new Date(memo.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <button class="btn-delete-memo" onclick="window.deleteMemo('${memo.id}')">삭제</button>
                        </div>
                    </div>
                `).join('');
        }
      }

      // 2. 대시보드 스티커 월 렌더링
      if (wallContainer && wallSection) {
        // 메모가 없어도 관리 버튼을 누를 수 있게 섹션은 항상 표시
        wallSection.style.display = 'block';

        if (memos.length === 0) {
          wallContainer.innerHTML = '<p style="color: #999; font-size: 13px; padding: 20px; text-align: center;">등록된 전역 메모가 없습니다. [+ 메모 추가/관리] 버튼을 눌러 첫 메모를 작성해 보세요!</p>';
        } else {
          const colorClasses = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
          wallContainer.innerHTML = memos.map((memo, idx) => {
            const colorClass = colorClasses[idx % colorClasses.length];
            return `
                    <div class="sticky-note ${colorClass}">
                        <div class="sticky-note-content">${TextUtils.escapeHtml(memo.content)}</div>
                        <div class="sticky-note-footer">
                            <span>📅 ${new Date(memo.createdAt).toLocaleDateString()}</span>
                            <button class="btn-memo-delete-sticker" onclick="window.deleteMemo('${memo.id}')">삭제</button>
                        </div>
                    </div>
                  `;
          }).join('');
        }
      }

    } catch (error) {
      console.error('Failed to render memos:', error);
    }
  },

  async addQuickMemo() {
    const input = document.getElementById('quickMemoInput');
    if (!input || !input.value.trim()) {
      alert('메모 내용을 입력해 주세요.');
      return;
    }

    const content = input.value.trim();
    try {
      await API.memos.create({ content });
      input.value = '';
      await this.render();
    } catch (error) {
      alert('메모 저장에 실패했습니다.');
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
    try {
      await API.memos.delete(id);
      await this.render();
    } catch (error) {
      alert('메모 삭제에 실패했습니다.');
    }
  }
};
