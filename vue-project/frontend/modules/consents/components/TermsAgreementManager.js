import { TERMS_CONFIG } from '../utils/termsConfig.js';
import ProductDescriptionPopup from './popups/ProductDescriptionPopup.js';
import SimpleDescriptionPopup from './popups/SimpleDescriptionPopup.js';
import RequiredCheckPopup from './popups/RequiredCheckPopup.js';
import RiskDisclosurePopup from './popups/RiskDisclosurePopup.js';
import SubscriberCheckPopup from './popups/SubscriberCheckPopup.js';
import InvestmentNoticePopup from './popups/InvestmentNoticePopup.js';

const { computed, ref, watch } = Vue;

export default {
    name: 'TermsAgreementManager',
    components: {
        ProductDescriptionPopup,
        SimpleDescriptionPopup,
        RequiredCheckPopup,
        RiskDisclosurePopup,
        SubscriberCheckPopup,
        InvestmentNoticePopup
    },
    props: {
        products: { type: Array, required: true },
        resetTrigger: { type: Number, default: 0 }
    },
    emits: ['all-agreed', 'update:agreed-terms'],
    template: `
  <div class="terms-agreement-manager">
    <!-- 상품별 카드 뷰 -->
    <div class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-card-inner">
          <div class="product-info-section">
            <div class="product-type-label">{{ product.type }}</div>
            <h3 class="product-display-name">{{ product.name }}</h3>
            <div class="product-status-line">
              <span class="status-indicator" :class="{ 'done': isProductAllAgreed(product.id, product.type) }"></span>
              {{ isProductAllAgreed(product.id, product.type) ? '동의 완료' : '동의 필요' }}
            </div>
            
            <button 
              class="quick-agree-btn"
              :class="{ 'agreed': isProductAllAgreed(product.id, product.type) }"
              @click="handleProductAllCheck(product.id, product.type, !isProductAllAgreed(product.id, product.type), $event)"
            >
              <svg v-if="isProductAllAgreed(product.id, product.type)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {{ isProductAllAgreed(product.id, product.type) ? '전체 동의됨' : '한번에 전체 동의' }}
            </button>
          </div>

          <div class="divider"></div>

          <div class="terms-items-section">
            <div v-for="term in getProductTerms(product.id, product.type)" 
                 :key="term.id" 
                 class="term-row"
                 :class="{ 'is-agreed': isTermAgreed(term.id) }"
                 @click="handleTermCheck(term, !isTermAgreed(term.id), $event)">
              
              <div class="term-check-box">
                <div class="custom-checkbox" :class="{ 'checked': isTermAgreed(term.id) }">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>

              <div class="term-meta">
                <span class="term-text">{{ term.label }}</span>
                <span v-if="term.requirePopup" class="popup-pill">POPUP</span>
              </div>

              <div class="term-arrow" v-if="term.requirePopup">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 동적 팝업 시퀀스 -->
    <template v-for="popup in activePopups" :key="popup.term.productId + '_' + popup.term.id">
        <component 
            :is="getPopupComponent(popup.term.popupComponent)"
            v-if="popup.isVisible"
            :term="popup.term"
            :is-last-popup="popup.isLastPopup"
            @confirm="handlePopupConfirm"
            @close="handlePopupClose"
        />
    </template>
  </div>
    `,
    setup(props, { emit }) {
        const agreedTerms = ref(new Set());
        const activePopups = ref([]);
        const allTermsList = ref([]);

        const getPopupComponent = (type) => {
            const map = {
                'PRODUCT_DESCRIPTION': 'ProductDescriptionPopup',
                'SIMPLE_DESCRIPTION': 'SimpleDescriptionPopup',
                'REQUIRED_CHECK': 'RequiredCheckPopup',
                'RISK_DISCLOSURE': 'RiskDisclosurePopup',
                'SUBSCRIBER_CHECK': 'SubscriberCheckPopup',
                'INVESTMENT_NOTICE': 'InvestmentNoticePopup'
            };
            return map[type] || null;
        };

        const initializeTermsList = () => {
            const terms = [];
            props.products.forEach(product => {
                const productTerms = TERMS_CONFIG[product.type];
                if (productTerms) {
                    productTerms.forEach(term => {
                        terms.push({ ...term, productId: product.id, productName: product.name, productType: product.type });
                    });
                }
            });
            allTermsList.value = terms.sort((a, b) => a.productId !== b.productId ? a.productId.localeCompare(b.productId) : a.order - b.order);
        };

        const getProductTerms = (productId, productType) => allTermsList.value.filter(t => t.productId === productId && t.productType === productType);
        const isTermAgreed = (termId) => agreedTerms.value.has(termId);
        const isProductAllAgreed = (productId, productType) => {
            const terms = getProductTerms(productId, productType);
            return terms.length > 0 && terms.every(t => agreedTerms.value.has(t.id));
        };

        const showPopup = (term) => {
            const existing = activePopups.value.find(p => p.term.id === term.id);
            const productTerms = getProductTerms(term.productId, term.productType);
            const popupTerms = productTerms.filter(t => t.requirePopup);
            const isLastPopup = popupTerms.length > 0 && popupTerms[popupTerms.length - 1].id === term.id;

            if (existing) {
                existing.isVisible = true;
                existing.isLastPopup = isLastPopup;
            } else {
                activePopups.value.push({ term, isVisible: true, isLastPopup });
            }
        };

        const hidePopup = (termId) => {
            const popup = activePopups.value.find(p => p.term.id === termId);
            if (popup) popup.isVisible = false;
        };

        const emitUpdate = () => {
            const list = Array.from(agreedTerms.value);
            emit('update:agreed-terms', list);
            const allTermsAgreed = allTermsList.value.length > 0 && allTermsList.value.every(t => agreedTerms.value.has(t.id));
            if (allTermsAgreed) emit('all-agreed', list);
        };

        const handleProductAllCheck = (productId, productType, isChecked, event) => {
            if (event) event.stopPropagation();
            const terms = getProductTerms(productId, productType);
            if (isChecked) {
                const nextPopup = terms.find(t => t.requirePopup && !agreedTerms.value.has(t.id));
                if (nextPopup) showPopup(nextPopup);
                else {
                    terms.forEach(t => agreedTerms.value.add(t.id));
                    emitUpdate();
                }
            } else {
                terms.forEach(t => { agreedTerms.value.delete(t.id); if (t.requirePopup) hidePopup(t.id); });
                emitUpdate();
            }
        };

        const handleTermCheck = (term, isChecked, event) => {
            if (event) event.stopPropagation();
            if (isChecked) {
                if (term.requirePopup) showPopup(term);
                else { agreedTerms.value.add(term.id); emitUpdate(); }
            } else {
                agreedTerms.value.delete(term.id);
                if (term.requirePopup) hidePopup(term.id);
                emitUpdate();
            }
        };

        const handlePopupConfirm = (term) => {
            agreedTerms.value.add(term.id);
            hidePopup(term.id);
            emitUpdate();
            const terms = getProductTerms(term.productId, term.productType);
            const next = terms.find(t => t.requirePopup && !agreedTerms.value.has(t.id));
            if (next) showPopup(next);
        };

        const handlePopupClose = (term) => {
            agreedTerms.value.delete(term.id);
            hidePopup(term.id);
            emitUpdate();
        };

        const resetAgreements = () => {
            agreedTerms.value.clear();
            activePopups.value = [];
            emitUpdate();
        };

        watch(() => props.products, initializeTermsList, { deep: true, immediate: true });
        watch(() => props.resetTrigger, (v) => { if (v > 0) resetAgreements(); });

        return { getPopupComponent, activePopups, getProductTerms, isTermAgreed, isProductAllAgreed, handleProductAllCheck, handleTermCheck, handlePopupConfirm, handlePopupClose };
    }
};
