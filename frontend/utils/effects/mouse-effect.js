/* frontend/utils/effects/mouse-effect.js */
import { StorageUtils } from '../dom.js';

export const MouseEffect = {
  container: null,
  lastCreateTime: 0,
  createInterval: 50,
  currentMode: 'star', // 기본값
  opacity: 1.0, // 추가: 효과 투명도

  effects: {
    star: ['★', '☆', '✧', '✨', '⭐'],
    heart: ['❤️', '💖', '💘', '💝', '💕'],
    bubble: ['', '', '', ''] // 버블은 텍스트 없이 CSS 테두리로 표현
  },

  init() {
    if (this.container) return;

    // 저장된 이펙트 모드 및 투명도 불러오기
    this.currentMode = StorageUtils.get('mouseEffectMode', 'star');
    this.opacity = parseFloat(StorageUtils.get('mouseEffectOpacity', '1.0'));

    this.container = document.createElement('div');
    this.container.id = 'mouse-tracker-container';
    document.body.appendChild(this.container);

    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this.burstFragments(e));
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
    if (this.currentMode === 'bubble') {
      fragment.style.width = `${size}px`;
      fragment.style.height = `${size}px`;
    }

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

      const rotStr = this.currentMode === 'bubble' ? '' : `rotate(${rotation * progress}deg)`;
      fragment.style.transform = `translate3d(${posX - x}px, ${posY - y}px, 0) ${rotStr} scale(${scale})`;
      fragment.style.opacity = currentOpacity;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
};
