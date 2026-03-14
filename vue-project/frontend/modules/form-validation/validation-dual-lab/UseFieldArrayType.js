/* d:\workspace\JavascriptPureLibrary\vue-project\frontend\modules\form-validation\validation-dual-lab\UseFieldArrayType.js */
export default {
    template: /* html */`
        <div class="page-wrap" style="max-width: 100%;">
            <!-- Toolbar (Same UI as UseFormType) -->
            <div class="toolbar">
                <span class="badge">{{ fields.length }}</span>
                <span style="font-size:13px; color:var(--muted)">개 상품 (useFieldArray)</span>
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
                    <button class="btn btn-ghost btn-sm" @click="resetValues" :disabled="fields.length === 0" title="행은 유지하고 입력값만 초기화">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        입력 값 초기화
                    </button>
                    <button class="btn btn-ghost btn-sm" @click="showResetPopup = true" :disabled="fields.length === 0" title="모든 행 삭제">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        전체 삭제
                    </button>
                </div>
            </div>

            <!-- Product list -->
            <div v-if="fields.length > 0">
                <div class="list-header">
                    <div>#</div>
                    <div>날짜</div>
                    <div>상품명</div>
                    <div>가격</div>
                    <div></div>
                </div>
                <transition-group name="row" tag="div">
                    <div class="product-row" v-for="(field, index) in fields" :key="field.key">
                        <div class="row-num">{{ index + 1 }}</div>
                        <div>
                            <custom-input :name="'products[' + index + '].date'" type="date" :rules="validateRules.date" v-model="field.value.date" placeholder="날짜 선택" />
                        </div>
                        <div>
                            <custom-input :name="'products[' + index + '].name'" type="text" :rules="validateRules.name" v-model="field.value.name" placeholder="상품명 입력" />
                        </div>
                        <div class="price-container">
                            <div class="price-type-group">
                                <label class="radio-label">
                                    <input type="radio" v-model="field.value.priceType" value="amount" :name="'priceType_' + field.key" @change="handlePriceTypeChange(field.value)">
                                    <span>금액</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" v-model="field.value.priceType" value="full" :name="'priceType_' + field.key" @change="handlePriceTypeChange(field.value)">
                                    <span>전액</span>
                                </label>
                            </div>
                            <div class="price-input-wrap">
                                <custom-input :name="'products[' + index + '].price'" type="number" :rules="(val) => validateRules.price(val, field.value.fullPrice)" v-model="field.value.price" placeholder="가격 입력" :is-price="true" suffix="원" :class="{ 'is-full-price': field.value.priceType === 'full' }" />
                            </div>
                        </div>
                        <div class="row-del">
                            <button class="btn-icon" @click="remove(index)" title="삭제">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </transition-group>

                <div class="submit-area">
                    <button class="btn-submit" @click="onSubmit" style="background: var(--accent3);">
                        useFieldArray 데이터 전송
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
        const { ref } = Vue;
        const { useForm, useFieldArray } = VeeValidate;

        const addCount = ref(1);
        const showResetPopup = ref(false);
        const showToast = ref(false);
        const toastMsg = ref('');

        const { handleSubmit, resetForm } = useForm({
            initialValues: { products: [] }
        });

        const { fields, push, remove } = useFieldArray('products');

        const validateRules = {
            date: (val) => val ? true : '날짜 선택 필수',
            name: (val) => val && val.trim() ? true : '상품명 입력 필수',
            price: (val, max) => {
                if (val === undefined || val === null || val === '') return '가격 입력 필수';
                const num = Number(val);
                if (isNaN(num) || num <= 0) return '유효 가격 입력 필수';
                if (num > max) return `최대 금액(${max.toLocaleString()}원) 초과`;
                return true;
            }
        };

        const addProducts = () => {
            for (let i = 0; i < addCount.value; i++) {
                const randomFullPrice = Math.floor(Math.random() * 91 + 10) * 10000;
                push({
                    id: Date.now() + Math.random(),
                    date: '', name: '', price: '',
                    priceType: 'amount', fullPrice: randomFullPrice
                });
            }
            addCount.value = 1;
        };

        const handlePriceTypeChange = (product) => {
            product.price = product.priceType === 'full' ? product.fullPrice : '';
        };

        const resetValues = () => {
            const cleanedValues = fields.value.map(f => ({
                id: f.value.id,
                date: '',
                name: '',
                price: '',
                priceType: 'amount',
                fullPrice: f.value.fullPrice
            }));

            resetForm({
                values: {
                    products: cleanedValues
                }
            });
            showToastMessage('입력 값이 초기화되었습니다.');
        };

        const confirmReset = () => {
            resetForm();
            showResetPopup.value = false;
            showToastMessage('모든 데이터가 삭제되었습니다.');
        };

        const showToastMessage = (msg) => {
            toastMsg.value = msg;
            showToast.value = true;
            setTimeout(() => { showToast.value = false; }, 2500);
        };

        const onSubmit = handleSubmit((values) => {
            console.log('useFieldArray Submit:', values);
            alert('useFieldArray 전송 성공!');
        });

        return {
            fields, remove, addCount, showResetPopup, showToast, toastMsg,
            addProducts, confirmReset, resetValues, handlePriceTypeChange, onSubmit,
            validateRules
        };
    }
};
