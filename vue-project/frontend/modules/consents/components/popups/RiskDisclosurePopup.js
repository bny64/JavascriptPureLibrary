const template = `
  <div class="terms-popup-overlay" @click.self="handleClose">
    <div class="terms-popup">
      <div class="popup-header">
        <h2>{{ term.label }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="popup-content">
        <div class="product-info" v-if="term.productName">
          <span class="product-badge">{{ term.productName }}</span>
        </div>

        <div class="terms-text">
          {{ term.content }}
        </div>
      </div>

      <div class="popup-footer">
        <button class="btn btn-secondary" @click="handleClose">취소</button>
        <button class="btn btn-primary" @click="handleConfirm">
          {{ isLastPopup ? '확인 및 닫기' : '동의 후 다음' }}
        </button>
      </div>
    </div>
  </div>
`;

export default {
    name: 'RiskDisclosurePopup', 
    props: {
        term: { type: Object, required: true },
        isLastPopup: { type: Boolean, default: false }
    },
    emits: ['confirm', 'close'],
    template,
    setup(props, { emit }) {
        const handleConfirm = () => emit('confirm', props.term);
        const handleClose = () => emit('close', props.term);
        return { handleConfirm, handleClose };
    }
};