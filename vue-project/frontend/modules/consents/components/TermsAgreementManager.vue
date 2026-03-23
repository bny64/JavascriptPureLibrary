import { TERMS_CONFIG } from '../utils/termsConfig.js';
import BaseTermsPopup from './popups/BaseTermsPopup.vue';

const { computed, ref, watch } = Vue;

export default {
    name: 'TermsAgreementManager',
    components: {
        BaseTermsPopup
    },
    props: {
        products: {
            type: Array,
            required: true
        },
        resetTrigger: {
            type: Number,
            default: 0
        }
    },
    emits: ['all-agreed', 'update:agreed-terms'],
    template: `
  <div class="terms-agreement-manager">
    <!-- 상품별 약관 체크박스 목록 -->
    <div
        v-for="product in products"
        :key="product.id"
        class="product-terms-group card"
    >
      <div class="product-header">
        <label class="all-agree-checkbox">
          <input
              type="checkbox"
              :checked="isProductAllAgreed(product.id, product.type)"
              @change="handleProductAllCheck(product.id, product.type, $event.target.checked, $event)"
          />
          <span class="all-agree-label">전체 동의</span>
        </label>
        <div class="product-title">
          <span class="product-name">{{ product.name }}</span>
          <span class="product-type-badge">{{ product.type }}</span>
        </div>
      </div>

      <div class="terms-list">
        <div
            v-for="term in getProductTerms(product.id, product.type)"
            :key="term.id"
            class="term-item"
            :class="{ 'agreed': isTermAgreed(term.id) }"
        >
          <label>
            <div class="checkbox-box">
              <input
                  type="checkbox"
                  :checked="isTermAgreed(term.id)"
                  @change="handleTermCheck(term, $event.target.checked, $event)"
              />
            </div>
            <span class="term-label">{{ term.label }}</span>
            <span v-if="term.requirePopup" class="popup-required-badge">팝업확인 필수</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 동적 약관 팝업들 -->
    <BaseTermsPopup
        v-for="popup in activePopups"
        :key="popup.term.productId + '_' + popup.term.id"
        v-show="popup.isVisible"
        :term="popup.term"
        :is-last-popup="popup.isLastPopup"
        @confirm="handlePopupConfirm"
        @close="handlePopupClose"
    />
  </div>
    `,
    setup(props, { emit }) {
        const agreedTerms = ref(new Set());
        const activePopups = ref([]);
        const allTermsList = ref([]);

        // 모든 약관 목록 초기화
        const initializeTermsList = () => {
            const terms = [];

            props.products.forEach(product => {
                const productTerms = TERMS_CONFIG[product.type];
                if (productTerms) {
                    productTerms.forEach(term => {
                        terms.push({
                            ...term,
                            productId: product.id,
                            productName: product.name,
                            productType: product.type
                        });
                    });
                }
            });

            // 상품별, 순서별로 정렬
            allTermsList.value = terms.sort((a, b) => {
                if (a.productId !== b.productId) {
                    return a.productId.localeCompare(b.productId);
                }
                return a.order - b.order;
            });
        };

        // 특정 상품의 약관 목록 가져오기
        const getProductTerms = (productId, productType) => {
            return allTermsList.value.filter(
                term => term.productId === productId && term.productType === productType
            );
        };

        // 약관 동의 여부 확인
        const isTermAgreed = (termId) => {
            return agreedTerms.value.has(termId);
        };

        // 특정 상품의 모든 약관이 동의되었는지 확인
        const isProductAllAgreed = (productId, productType) => {
            const productTerms = getProductTerms(productId, productType);
            return productTerms.length > 0 && productTerms.every(term => agreedTerms.value.has(term.id));
        };

        // 팝업 표시
        const showPopup = (term) => {
            const existingPopup = activePopups.value.find(popup => popup.term.id === term.id);

            // 현재 상품의 모든 팝업 약관 중 마지막인지 확인
            const productTerms = getProductTerms(term.productId, term.productType);
            const popupTerms = productTerms.filter(t => t.requirePopup);
            const isLastPopup = popupTerms.length > 0 && popupTerms[popupTerms.length - 1].id === term.id;

            if (existingPopup) {
                existingPopup.isVisible = true;
                existingPopup.isLastPopup = isLastPopup;
            } else {
                activePopups.value.push({
                    term,
                    isVisible: true,
                    isLastPopup: isLastPopup
                });
            }
        };

        // 팝업 숨기기
        const hidePopup = (termId) => {
            const popup = activePopups.value.find(popup => popup.term.id === termId);
            if (popup) {
                popup.isVisible = false;
            }
        };

        const emitUpdate = () => {
            const agreedList = Array.from(agreedTerms.value);
            emit('update:agreed-terms', agreedList);
            if (isAllTermsAgreed.value) {
                emit('all-agreed', agreedList);
            }
        };

        const isAllTermsAgreed = computed(() => {
            return allTermsList.value.length > 0 && allTermsList.value.every(term => agreedTerms.value.has(term.id));
        });

        // 상품 전체 동의 체크박스 클릭 처리
        const handleProductAllCheck = (productId, productType, isChecked, event) => {
            const productTerms = getProductTerms(productId, productType);

            if (isChecked) {
                event.target.checked = false; 

                const firstUnagreedPopupTerm = productTerms.find(
                    term => term.requirePopup && !agreedTerms.value.has(term.id)
                );

                if (firstUnagreedPopupTerm) {
                    showPopup(firstUnagreedPopupTerm);
                } else {
                    productTerms.forEach(term => {
                        if (!agreedTerms.value.has(term.id)) {
                            agreedTerms.value.add(term.id);
                        }
                    });
                    emitUpdate();
                }
            } else {
                productTerms.forEach(term => {
                    agreedTerms.value.delete(term.id);
                    if (term.requirePopup) hidePopup(term.id);
                });
                emitUpdate();
            }
        };

        // 개별 체크박스 클릭 처리
        const handleTermCheck = (term, isChecked, event) => {
            if (isChecked) {
                if (term.requirePopup) {
                    event.target.checked = false;
                    showPopup(term);
                } else {
                    agreedTerms.value.add(term.id);
                    emitUpdate();
                }
            } else {
                agreedTerms.value.delete(term.id);
                if (term.requirePopup) hidePopup(term.id);
                emitUpdate();
            }
        };

        // 팝업 확인 버튼 처리
        const handlePopupConfirm = (term) => {
            agreedTerms.value.add(term.id);
            hidePopup(term.id);
            emitUpdate();

            const productTerms = getProductTerms(term.productId, term.productType);
            const nextUnagreedTermInProduct = productTerms.find(
                t => t.requirePopup && !agreedTerms.value.has(t.id)
            );

            if (nextUnagreedTermInProduct) {
                showPopup(nextUnagreedTermInProduct);
            }
        };

        const handlePopupClose = (term) => {
            agreedTerms.value.delete(term.id);
            hidePopup(term.id);
            emitUpdate();
        };

        const resetAgreements = () => {
            agreedTerms.value.clear();
            activePopups.value.forEach(p => p.isVisible = false);
            activePopups.value = [];
            emitUpdate();
        };

        watch(() => props.products, () => initializeTermsList(), { deep: true, immediate: true });
        watch(() => props.resetTrigger, (newVal) => { if (newVal > 0) resetAgreements(); });

        return {
            activePopups,
            getProductTerms,
            isTermAgreed,
            isProductAllAgreed,
            handleProductAllCheck,
            handleTermCheck,
            handlePopupConfirm,
            handlePopupClose
        };
    }
};
