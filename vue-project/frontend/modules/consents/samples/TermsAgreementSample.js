import TermsAgreementManager from '../components/TermsAgreementManager.vue';
import { PRODUCT_TYPES, TERMS_CONFIG } from '../utils/termsConfig.js';

const { ref, computed, watch } = Vue;

export default {
    name: 'TermsAgreementSample',
    components: {
        TermsAgreementManager
    },
    template: `
  <div class="page-wrap">
    <div class="header">
      <h1>약관 동의 프로세스 실습</h1>
      <p>Flexible Terms Agreement Flow with Dynamic Popups (Local Component Pattern)</p>
    </div>

    <div class="grid-2-col">
      <!-- 왼쪽: 약관 관리 영역 -->
      <div class="view-content">
        <TermsAgreementManager
            :products="products"
            :reset-trigger="resetTrigger"
            @all-agreed="handleAllAgreed"
            @update:agreed-terms="handleUpdateAgreedTerms"
        />
      </div>

      <!-- 오른쪽: 상태 모니터링 및 제어 -->
      <div class="dashboard-sidebar-right">
        <div class="card status-card">
          <div class="card-header">
            <h3>📊 진행 현황</h3>
            <span class="progress-percent" :class="{ 'completed': isAllAgreed }">
              {{ progressPercent }}%
            </span>
          </div>
          
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
          </div>

          <div class="status-details">
            <div class="status-row">
              <span class="label">동의 현황</span>
              <span class="value">{{ agreedTermsList.length }} / {{ totalTermsCount }}</span>
            </div>
            <div class="status-row">
              <span class="label">전체 완료</span>
              <span class="value" :class="isAllAgreed ? 'text-success' : 'text-muted'">
                {{ isAllAgreed ? 'YES' : 'NO' }}
              </span>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-secondary" @click="resetAll" style="width: 100%;">
              🔄 전체 초기화
            </button>
            <button
                class="btn btn-primary next-step-btn"
                @click="submitAgreements"
                :disabled="!isAllAgreed"
                style="width: 100%; height: 50px; font-size: 15px;"
            >
              다음 단계로 이동 🚀
            </button>
          </div>
        </div>

        <div class="card info-card" style="margin-top: 24px;">
          <div class="card-header">
            <h3>📝 가이드</h3>
          </div>
          <div class="card-content">
            <ul class="guide-list">
              <li>체크박스 클릭 시 팝업 확인이 필수인 항목은 자동으로 팝업이 노출됩니다.</li>
              <li>전체 동의 클릭 시, 팝업이 필요한 모든 약관을 순차적으로 노출합니다.</li>
              <li>모든 상품의 약관에 동의해야 다음 단계 버튼이 활성화됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
    `,
    setup() {
        const agreedTermsList = ref([]);
        const resetTrigger = ref(0);

        const products = ref([
            {
                id: 'product_fund_01',
                name: '유럽 배당주 펀드',
                type: PRODUCT_TYPES.FUND
            },
            {
                id: 'product_els_02',
                name: '지수형 낙인 ELS',
                type: PRODUCT_TYPES.ELS
            },
            {
                id: 'base_agreements',
                name: '공통 서비스 이용 약관',
                type: PRODUCT_TYPES.GENERAL
            }
        ]);

        // 전체 약관 개수 계산
        const totalTermsCount = computed(() => {
            return products.value.reduce((count, product) => {
                const productTerms = TERMS_CONFIG[product.type];
                return count + (productTerms ? productTerms.length : 0);
            }, 0);
        });

        const progressPercent = computed(() => {
            if (totalTermsCount.value === 0) return 0;
            return Math.round((agreedTermsList.value.length / totalTermsCount.value) * 100);
        });

        const isAllAgreed = computed(() => {
            return agreedTermsList.value.length > 0 &&
                agreedTermsList.value.length === totalTermsCount.value;
        });

        const handleUpdateAgreedTerms = (terms) => {
            agreedTermsList.value = terms;
        };

        const handleAllAgreed = (terms) => {
            agreedTermsList.value = terms;
        };

        const resetAll = () => {
            agreedTermsList.value = [];
            resetTrigger.value += 1;
        };

        const submitAgreements = () => {
            alert('모든 약관 동의가 완료되었습니다! 다음 단계로 프로세스를 전환합니다.');
        };

        return {
            products,
            agreedTermsList,
            resetTrigger,
            totalTermsCount,
            progressPercent,
            isAllAgreed,
            handleUpdateAgreedTerms,
            handleAllAgreed,
            resetAll,
            submitAgreements
        };
    }
};
