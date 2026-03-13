/* frontend/utils/effects/mouse-effect.js */
import { StorageUtils } from '../dom.js';

export const MouseEffect = {
  container: null,
  lastCreateTime: 0,
  createInterval: 50,
  currentMode: 'star', // 기본값
  opacity: 1.0, // 추가: 효과 투명도
  currentCursor: 'circle', // 기본 커서 디자인
  cursorSize: 16, // 고정 커서 크기 (짝수 사용으로 픽셀 정렬 최적화)

  effects: {
    star: ['★', '☆', '✧', '✨', '⭐'],
    heart: ['❤️', '💖', '💘', '💝', '💕'],
    petal: ['🌸', '🍃', '🌿', '🌱', '🌼'] // 버블 대신 꽃잎 효과 추가
  },

  init() {
    if (this.container) return;

    // 저장된 설정 불러오기
    this.currentMode = StorageUtils.get('mouseEffectMode', 'star');
    this.opacity = parseFloat(StorageUtils.get('mouseEffectOpacity', '1.0'));
    this.currentCursor = StorageUtils.get('mouseCursorStyle', 'circle');

    this.container = document.createElement('div');
    this.container.id = 'mouse-tracker-container';
    document.body.appendChild(this.container);

    // 프리미엄 커스텀 커서 생성
    this.pointer = document.createElement('div');
    this.pointer.id = 'custom-mouse-pointer';
    this.pointer.className = this.currentCursor;
    this.pointer.style.width = `${this.cursorSize}px`;
    this.pointer.style.height = `${this.cursorSize}px`;
    document.body.appendChild(this.pointer);

    window.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
      this.updateCustomPointer(e);
    });

    window.addEventListener('mousedown', (e) => {
      this.burstFragments(e);
      this.pointer.classList.add('click');
    });

    window.addEventListener('mouseup', () => {
      this.pointer.classList.remove('click');
    });

    // 버튼이나 링크 위에 마우스가 올라갔을 때의 호버 처리
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('button, a, input[type="range"], .theme-circle, .calendar-day')) {
        this.pointer.classList.add('hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('button, a, input[type="range"], .theme-circle, .calendar-day')) {
        this.pointer.classList.remove('hover');
      }
    });
  },

  setCursorStyle(style) {
    if (!this.pointer) return;
    this.pointer.className = style;
    this.currentCursor = style;
    StorageUtils.set('mouseCursorStyle', style);
  },


  updateCustomPointer(e) {
    if (!this.pointer) return;
    this.pointer.style.left = `${e.clientX}px`;
    this.pointer.style.top = `${e.clientY}px`;
  },

  setMode(mode) {
    this.currentMode = mode;
    StorageUtils.set('mouseEffectMode', mode);
  },

  setOpacity(val) {
    this.opacity = parseFloat(val);
    StorageUtils.set('mouseEffectOpacity', val);
  },

  handleMouseMove(e) {
    if (this.currentMode === 'off' || this.opacity <= 0) return;

    const currentTime = Date.now();
    if (currentTime - this.lastCreateTime > this.createInterval) {
      this.createFragment(e.clientX, e.clientY);
      this.lastCreateTime = currentTime;
    }
  },

  burstFragments(e) {
    if (this.currentMode === 'off' || this.opacity <= 0) return;

    for (let i = 0; i < 8; i++) {
      this.createFragment(e.clientX, e.clientY, true);
    }
  },

  createFragment(x, y, isBurst = false) {
    if (this.currentMode === 'off') return;

    const fragment = document.createElement('span');
    fragment.className = `mouse-fragment ${this.currentMode}`;

    const symbols = this.effects[this.currentMode];
    if (symbols && symbols.length > 0) {
      fragment.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    }

    fragment.style.left = `${x}px`;
    fragment.style.top = `${y}px`;

    // 랜덤 속성
    const size = Math.random() * 15 + 10;
    fragment.style.fontSize = `${size}px`;

    this.container.appendChild(fragment);

    // 애니메이션
    const velocityX = (Math.random() - 0.5) * (isBurst ? 12 : 4);
    const velocityY = (Math.random() - 0.5) * (isBurst ? 12 : 4) + (isBurst ? -6 : 1);
    const rotation = (Math.random() - 0.5) * 500;

    let posX = x;
    let posY = y;
    let currentOpacity = this.opacity; // 초기 투명도는 설정값 따름
    let scale = 1;

    const startTime = Date.now();
    const duration = isBurst ? 1500 : 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        fragment.remove();
        return;
      }

      posX += velocityX;
      posY += velocityY + (progress * 4); // 중력

      // progress에 따른 소멸 효과와 전역 opacity 결합
      currentOpacity = (1 - progress) * this.opacity;
      scale = 1 - (progress * 0.3);

      const rotStr = `rotate(${rotation * progress}deg)`;
      fragment.style.transform = `translate3d(${posX - x}px, ${posY - y}px, 0) ${rotStr} scale(${scale})`;
      fragment.style.opacity = currentOpacity;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
};
