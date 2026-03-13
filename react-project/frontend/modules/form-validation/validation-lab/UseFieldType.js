import html from '../../../lib/htmEngine.js';
import CustomInput from '../../../components/CustomInput.js';

const { useState } = window.React;

/**
 * UseFieldType (Manual State Approach)
 * Manages products array using standard useState and validates manually on submit.
 */
export default function UseFieldType() {
    const [products, setProducts] = useState([]);
    const [addCount, setAddCount] = useState(1);
    const [errors, setErrors] = useState({});
    const [showResetPopup, setShowResetPopup] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    const addProducts = () => {
        const newItems = [];
        for (let i = 0; i < addCount; i++) {
            const randomFullPrice = Math.floor(Math.random() * 91 + 10) * 10000;
            newItems.push({
                id: Date.now() + i + Math.random(),
                date: '',
                name: '',
                price: '',
                priceType: 'amount',
                fullPrice: randomFullPrice
            });
        }
        setProducts([...products, ...newItems]);
        setAddCount(1);
    };

    const updateProduct = (id, field, value) => {
        setProducts(products.map(p => {
            if (p.id === id) {
                const updated = { ...p, [field]: value };
                if (field === 'priceType' && value === 'full') {
                    updated.price = p.fullPrice;
                }
                return updated;
            }
            return p;
        }));
    };

    const handleBlur = (id, field) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const newErrors = { ...errors };
        const val = product[field];

        if (field === 'date') {
            if (!val) newErrors[`${id}_date`] = '날짜 필수';
            else delete newErrors[`${id}_date`];
        } else if (field === 'name') {
            if (!val || !val.trim()) newErrors[`${id}_name`] = '상품명 필수';
            else delete newErrors[`${id}_name`];
        } else if (field === 'price') {
            const priceNum = Number(val);
            if (!val || isNaN(priceNum) || priceNum <= 0) {
                newErrors[`${id}_price`] = '유효 가격 필수';
            } else if (priceNum > product.fullPrice) {
                newErrors[`${id}_price`] = `최대 ${product.fullPrice.toLocaleString()}원`;
            } else {
                delete newErrors[`${id}_price`];
            }
        }
        setErrors(newErrors);
    };

    const removeProduct = (id) => {
        setProducts(products.filter(p => p.id !== id));
        // 관련 에러도 한꺼번에 제거
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(id)) delete newErrors[key];
        });
        setErrors(newErrors);
    };

    const validate = () => {
        const newErrors = {};
        products.forEach(p => {
            if (!p.date) newErrors[`${p.id}_date`] = '날짜 필수';
            if (!p.name || !p.name.trim()) newErrors[`${p.id}_name`] = '상품명 필수';
            
            const priceNum = Number(p.price);
            if (!p.price || isNaN(priceNum) || priceNum <= 0) {
                newErrors[`${p.id}_price`] = '유효 가격 필수';
            } else if (priceNum > p.fullPrice) {
                newErrors[`${p.id}_price`] = `최대 ${p.fullPrice.toLocaleString()}원`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = () => {
        if (validate()) {
            console.log('Manual Submit Success:', products);
            alert('수동 상태 관리 제출 성공!');
        } else {
            alert('검증 실패: 입력을 확인해주세요.');
        }
    };

    const confirmReset = () => {
        setProducts([]);
        setErrors({});
        setShowResetPopup(false);
        showToastMessage('모든 데이터가 초기화되었습니다.');
    };

    const showToastMessage = (msg) => {
        setToastMsg(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    return html`
        <div className="page-wrap" style=${{ maxWidth: '100%' }}>
            <div className="toolbar">
                <span className="badge">${products.length}</span>
                <span style=${{ fontSize: '13px', color: 'var(--muted)' }}>개 상품 (Manual State)</span>
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
                    <button className="btn btn-ghost btn-sm" onClick=${() => setShowResetPopup(true)} disabled=${products.length === 0}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 .49-3.28" />
                        </svg>
                        전체 초기화
                    </button>
                </div>
            </div>

            ${products.length > 0 ? html`
                <div>
                    <div className="list-header">
                        <div>#</div>
                        <div>날짜</div>
                        <div>상품명</div>
                        <div>가격</div>
                        <div></div>
                    </div>
                    <div>
                        ${products.map((product, index) => html`
                            <div className="product-row" key=${product.id}>
                                <div className="row-num">${index + 1}</div>
                                <div>
                                    <${CustomInput}
                                        name=${`date_${product.id}`}
                                        type="date"
                                        value=${product.date}
                                        onChange=${(name, val) => updateProduct(product.id, 'date', val)}
                                        onBlur=${() => handleBlur(product.id, 'date')}
                                        error=${errors[`${product.id}_date`]}
                                    />
                                </div>
                                <div>
                                    <${CustomInput}
                                        name=${`name_${product.id}`}
                                        value=${product.name}
                                        onChange=${(name, val) => updateProduct(product.id, 'name', val)}
                                        onBlur=${() => handleBlur(product.id, 'name')}
                                        error=${errors[`${product.id}_name`]}
                                    />
                                </div>
                                <div className="price-container">
                                    <div className="price-type-group">
                                        <label className="radio-label">
                                            <input type="radio" checked=${product.priceType === 'amount'} onChange=${() => updateProduct(product.id, 'priceType', 'amount')} />
                                            <span>금액</span>
                                        </label>
                                        <label className="radio-label">
                                            <input type="radio" checked=${product.priceType === 'full'} onChange=${() => updateProduct(product.id, 'priceType', 'full')} />
                                            <span>전액</span>
                                        </label>
                                    </div>
                                    <div className="price-input-wrap">
                                        <${CustomInput}
                                            name=${`price_${product.id}`}
                                            type="number"
                                            value=${product.price}
                                            onChange=${(name, val) => updateProduct(product.id, 'price', val)}
                                            onBlur=${() => handleBlur(product.id, 'price')}
                                            suffix="원"
                                            placeholder="가격 입력"
                                            error=${errors[`${product.id}_price`]}
                                        />
                                    </div>
                                </div>
                                <div className="row-del">
                                    <button className="btn-icon" onClick=${() => removeProduct(product.id)} title="삭제">
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
                        <button className="btn-submit" onClick=${onSubmit} style=${{ background: 'var(--accent2)' }}>
                            Manual Submission
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
