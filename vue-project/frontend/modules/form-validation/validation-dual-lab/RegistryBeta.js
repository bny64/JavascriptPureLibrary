/* d:\workspace\JavascriptPureLibrary\vue-project\frontend\modules\form-validation\samples\RegistryBeta.js */
export default {
    template: `
        <div class="page-wrap" style="max-width: 100%;">
            <!-- Toolbar -->
            <div class="toolbar">
                <span class="badge">{{ products.length }}</span>
                <span style="font-size:13px; color:var(--muted)">개 상품</span>
                <div class="toolbar-right">
                    <div class="count-wrap">
                        <label>추가 수량</label>
                        <input class="count-input" type="number" v-model.number="addCount" min="1" max="20" />
                    </div>
                    <button class="btn btn-primary btn-sm" @click="addProducts">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        상품 추가
                    </button>
                    <button class="btn btn-ghost btn-sm" @click="showResetPopup = true" :disabled="products.length === 0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 .49-3.28" />
                        </svg>
                        전체 초기화
                    </button>
                </div>
            </div>

            <!-- Product list -->
            <div v-if="products.length > 0">
                <div class="list-header">
                    <div>#</div>
                    <div>날짜</div>
                    <div>상품명</div>
                    <div>가격</div>
                    <div></div>
                </div>
                <transition-group name="row" tag="div">
                    <div class="product-row" v-for="(product, index) in products" :key="product.id">
                        <div class="row-num">{{ index + 1 }}</div>
                        <div>
                            <custom-input :name="'date_' + product.id" type="date" :rules="validateDate" v-model="product.date" placeholder="날짜 선택" />
                        </div>
                        <div>
                            <custom-input :name="'name_' + product.id" type="text" :rules="validateName" v-model="product.name" placeholder="상품명 입력" />
                        </div>
                        <div class="price-container">
                            <div class="price-type-group">
                                <label class="radio-label">
                                    <input type="radio" v-model="product.priceType" value="amount" :name="'priceType_' + product.id" @change="handlePriceTypeChange(product)">
                                    <span>금액</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" v-model="product.priceType" value="full" :name="'priceType_' + product.id" @change="handlePriceTypeChange(product)">
                                    <span>전액</span>
                                </label>
                            </div>
                            <div class="price-input-wrap">
                                <custom-input :name="'price_' + product.id" type="number" :rules="(val) => validatePrice(val, product.fullPrice)" v-model="product.price" placeholder="가격 입력" :is-price="true" suffix="원" :class="{ 'is-full-price': product.priceType === 'full' }" />
                            </div>
                        </div>
                        <div class="row-del">
                            <button class="btn-icon" @click="removeProduct(product.id)" title="삭제">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </transition-group>

                <div class="submit-area">
                    <button class="btn-submit" @click="onSubmit">
                        데이터 전송 (Console)
                    </button>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
                <div class="icon">📦</div>
                <p>등록된 상품이 없습니다. 버튼을 눌러 추가하세요.</p>
            </div>

            <!-- Reset Popup -->
            <div v-if="showResetPopup" class="overlay">
                <div class="popup">
                    <h3>전체 데이터 초기화</h3>
                    <p>작성 중인 모든 상품 데이터가 삭제됩니다. 계속하시겠습니까?</p>
                    <div class="popup-actions">
                        <button class="btn btn-danger" @click="confirmReset">초기화 실행</button>
                        <div class="popup-cancel">
                            <button @click="showResetPopup = false">취소</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Toast -->
            <transition name="fade">
                <div v-if="showToast" class="toast">
                    {{ toastMsg }}
                </div>
            </transition>
        </div>
    `,
    setup() {
        const { ref, reactive } = Vue;
        const { useForm } = VeeValidate;

        const products = ref([]);
        const addCount = ref(1);
        const showResetPopup = ref(false);
        const showToast = ref(false);
        const toastMsg = ref('');

        const { handleSubmit, resetForm } = useForm();

        const addProducts = () => {
            for (let i = 0; i < addCount.value; i++) {
                // 전액 기준가 랜덤 생성 (10만 ~ 100만)
                const randomFullPrice = Math.floor(Math.random() * 91 + 10) * 10000;
                products.value.push({
                    id: Date.now() + Math.random(),
                    date: '',
                    name: '',
                    price: '',
                    priceType: 'amount',
                    fullPrice: randomFullPrice
                });
            }
            addCount.value = 1;
        };

        const removeProduct = (id) => {
            products.value = products.value.filter(p => p.id !== id);
        };

        const handlePriceTypeChange = (product) => {
            if (product.priceType === 'full') {
                product.price = product.fullPrice;
            } else {
                product.price = '';
            }
        };

        const confirmReset = () => {
            products.value = [];
            resetForm();
            showResetPopup.value = false;
            showToastMessage('모든 데이터가 초기화되었습니다.');
        };

        const showToastMessage = (msg) => {
            toastMsg.value = msg;
            showToast.value = true;
            setTimeout(() => { showToast.value = false; }, 2500);
        };

        const validateDate = (val) => val ? true : '날짜를 선택해주세요.';
        const validateName = (val) => val && val.trim() ? true : '상품명을 입력해주세요.';
        const validatePrice = (val, max) => {
            if (val === undefined || val === null || val === '') return '가격을 입력해주세요.';
            const num = Number(val);
            if (isNaN(num) || num <= 0) return '유효한 가격을 입력해주세요.';
            if (num > max) return `최대 금액(${max.toLocaleString()}원)을 초과할 수 없습니다.`;
            return true;
        };

        const onSubmit = handleSubmit((values) => {
            console.log('Submission Success:', values);
            alert('전송 성공! 콘솔창을 확인하세요.');
        });

        return {
            products, addCount, showResetPopup, showToast, toastMsg,
            addProducts, removeProduct, confirmReset, handlePriceTypeChange, onSubmit,
            validateDate, validateName, validatePrice
        };
    }
};
