import html from '../../../lib/htmEngine.js';
import CustomInput from '../../../components/CustomInput.js';

const { useState } = window.React;
const { useForm, useFieldArray, Controller } = window.ReactHookForm;

/**
 * UseFormType (Standard React Hook Form approach)
 * Demonstrates dynamic field arrays using useFieldArray.
 */
export default function UseFormType() {
    const [addCount, setAddCount] = useState(1);
    const [showResetPopup, setShowResetPopup] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    const { control, handleSubmit, reset, trigger } = useForm({
        defaultValues: {
            products: []
        },
        mode: 'onTouched'
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "products"
    });

    const addProducts = (e) => {
        e.preventDefault();
        const newItems = [];
        for (let i = 0; i < addCount; i++) {
            const randomFullPrice = Math.floor(Math.random() * 91 + 10) * 10000;
            newItems.push({
                id: Date.now() + Math.random(),
                date: '',
                name: '',
                price: '',
                priceType: 'amount',
                fullPrice: randomFullPrice
            });
        }
        append(newItems);
        setAddCount(1);
    };

    const handlePriceTypeChange = (index, type) => {
        const product = fields[index];
        // Note: With RHF we should use setValue or similar for programmatic updates
        // but since fields is a wrapper, we might need to handle this via setValue
    };

    const confirmReset = () => {
        reset({ products: [] });
        setShowResetPopup(false);
        showToastMessage('모든 데이터가 초기화되었습니다.');
    };

    const showToastMessage = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const onSubmit = (data) => {
        console.log('UseFormType Submit:', data);
        alert('React-Hook-Form 유제출 성공!');
    };

    return html`
        <div className="page-wrap" style=${{ maxWidth: '100%' }}>
            <div className="toolbar">
                <span className="badge">${fields.length}</span>
                <span style=${{ fontSize: '13px', color: 'var(--muted)' }}>개 상품 (useForm)</span>
                <div className="toolbar-right">
                    <div className="count-wrap">
                        <label>추가 수량</label>
                        <input className="count-input" type="number" value=${addCount} onInput=${e => setAddCount(parseInt(e.target.value) || 1)} min="1" max="20" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick=${addProducts}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        상품 추가
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick=${() => setShowResetPopup(true)} disabled=${fields.length === 0}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 .49-3.28" />
                        </svg>
                        전체 초기화
                    </button>
                </div>
            </div>

            ${fields.length > 0 ? html`
                <div>
                    <div className="list-header">
                        <div>#</div>
                        <div>날짜</div>
                        <div>상품명</div>
                        <div>가격</div>
                        <div></div>
                    </div>
                    <div>
                        ${fields.map((field, index) => html`
                            <div className="product-row" key=${field.id}>
                                <div className="row-num">${index + 1}</div>
                                <div>
                                    <${Controller}
                                        name=${`products.${index}.date`}
                                        control=${control}
                                        rules=${{ required: '날짜 필수' }}
                                        render=${({ field: rhfField, fieldState: { error } }) => html`
                                            <${CustomInput}
                                                name=${rhfField.name}
                                                type="date"
                                                value=${rhfField.value}
                                                onChange=${(name, val) => rhfField.onChange(val)}
                                                onBlur=${rhfField.onBlur}
                                                placeholder="날짜 선택"
                                                error=${error?.message}
                                            />
                                        `}
                                    />
                                </div>
                                <div>
                                    <${Controller}
                                        name=${`products.${index}.name`}
                                        control=${control}
                                        rules=${{ required: '상품명 필수' }}
                                        render=${({ field: rhfField, fieldState: { error } }) => html`
                                            <${CustomInput}
                                                name=${rhfField.name}
                                                value=${rhfField.value}
                                                onChange=${(name, val) => rhfField.onChange(val)}
                                                onBlur=${rhfField.onBlur}
                                                placeholder="상품명 입력"
                                                error=${error?.message}
                                            />
                                        `}
                                    />
                                </div>
                                <div className="price-container">
                                    <div className="price-type-group">
                                        <${Controller}
                                            name=${`products.${index}.priceType`}
                                            control=${control}
                                            render=${({ field: rhfField }) => html`
                                                <label className="radio-label">
                                                    <input type="radio" checked=${rhfField.value === 'amount'} onChange=${() => rhfField.onChange('amount')} />
                                                    <span>금액</span>
                                                </label>
                                                <label className="radio-label">
                                                    <input type="radio" checked=${rhfField.value === 'full'} onChange=${() => {
                                                        rhfField.onChange('full');
                                                        // Update price to fullPrice
                                                        const fullPrice = fields[index].fullPrice;
                                                        // Note: We'd need setValue from useForm for this
                                                    }} />
                                                    <span>전액</span>
                                                </label>
                                            `}
                                        />
                                    </div>
                                    <div className="price-input-wrap">
                                        <${Controller}
                                            name=${`products.${index}.price`}
                                            control=${control}
                                            rules=${{ 
                                                required: '가격 필수',
                                                validate: (v) => {
                                                    const num = Number(v);
                                                    if (isNaN(num) || num <= 0) return '유효 가격 필수';
                                                    if (num > fields[index].fullPrice) return `최대 ${fields[index].fullPrice.toLocaleString()}원`;
                                                    return true;
                                                }
                                            }}
                                            render=${({ field: rhfField, fieldState: { error } }) => html`
                                                <${CustomInput}
                                                    name=${rhfField.name}
                                                    type="number"
                                                    value=${rhfField.value}
                                                    onChange=${(name, val) => rhfField.onChange(val)}
                                                    onBlur=${() => {
                                                        rhfField.onBlur();
                                                        trigger(`products.${index}.price`);
                                                    }}
                                                    isPrice=${true}
                                                    suffix="원"
                                                    placeholder="가격 입력"
                                                    error=${error?.message}
                                                />
                                            `}
                                        />
                                    </div>
                                </div>
                                <div className="row-del">
                                    <button className="btn-icon" onClick=${() => remove(index)} title="삭제">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>

                    <div className="submit-area">
                        <button className="btn-submit" onClick=${handleSubmit(onSubmit)}>
                            Standard Submission
                        </button>
                    </div>
                </div>
            ` : html`
                <div className="empty-state">
                    <div className="icon">📦</div>
                    <p>등록된 상품이 없습니다. 버튼을 눌러 추가하세요.</p>
                </div>
            `}

            ${showResetPopup && html`
                <div className="overlay">
                    <div className="popup">
                        <h3>전체 데이터 초기화</h3>
                        <p>작성 중인 모든 상품 데이터가 삭제됩니다. 계속하시겠습니까?</p>
                        <div className="popup-actions">
                            <button className="btn btn-danger" onClick=${confirmReset}>초기화 실행</button>
                            <div className="popup-cancel">
                                <button onClick=${() => setShowResetPopup(false)}>취소</button>
                            </div>
                        </div>
                    </div>
                </div>
            `}

            ${showToast && html`<div className="toast fade-in">${toastMsg}</div>`}
        </div>
    `;
}
