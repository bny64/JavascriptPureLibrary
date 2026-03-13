import html from '../lib/htmEngine.js';
import CustomInput from '../components/CustomInput.js';

const { useState, useMemo } = window.React;

export default function ProductRegistry() {
    const [products, setProducts] = useState([
        { id: Date.now(), title: '', type: '', price: '' }
    ]);
    const [errors, setErrors] = useState({});

    const addProduct = () => {
        setProducts([...products, { id: Date.now(), title: '', type: '', price: '' }]);
    };

    const removeProduct = (idx) => {
        if (products.length === 1) return;
        setProducts(products.filter((_, i) => i !== idx));
    };

    const handleChange = (idx, name, value) => {
        const newProducts = [...products];
        newProducts[idx][name] = value;
        setProducts(newProducts);
    };

    const globalReset = () => {
        setProducts([{ id: Date.now(), title: '', type: '', price: '' }]);
        setErrors({});
    };

    const validate = () => {
        let isValid = true;
        const newErrors = {};

        products.forEach((product, idx) => {
            if (!product.title) {
                newErrors[`${idx}-title`] = '상품명은 필수입니다.';
                isValid = false;
            }
            if (!product.type) {
                newErrors[`${idx}-type`] = '분류는 필수입니다.';
                isValid = false;
            }
            if (!product.price || Number(product.price) <= 0) {
                newErrors[`${idx}-price`] = '유효한 가격을 입력하세요.';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const globalSubmit = () => {
        if (validate()) {
            alert('유효성 검증 성공!\n\n' + JSON.stringify(products, null, 2));
        } else {
            alert('입력값을 다시 확인해주세요.');
        }
    };

    return html`
        <div className="page-wrap" style=${{ maxWidth: '100%' }}>
            <div className="header" style=${{ marginBottom: '24px' }}>
                <h2>React Dynamic Product Registry</h2>
                <div className="header-tools">
                    <button className="btn btn-secondary" onClick=${globalReset}>전체 초기화</button>
                    <button className="btn btn-primary" onClick=${globalSubmit}>일괄 등록</button>
                    <button className="btn btn-primary" onClick=${addProduct}>+ 추가</button>
                </div>
            </div>

            <div className="product-grid">
                ${products.map((product, idx) => html`
                    <div className="card" key=${product.id}>
                        <div className="card-header">
                            <h4 className="card-title">상품 #${idx + 1}</h4>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick=${() => removeProduct(idx)}
                                disabled=${products.length === 1}
                            >
                                삭제
                            </button>
                        </div>

                        <div className="card-content">
                            <div className="form-group mb-3">
                                <label className="form-label">상품명 <span className="required">*</span></label>
                                <${CustomInput}
                                    name="title"
                                    value=${product.title}
                                    onChange=${(n, v) => handleChange(idx, n, v)}
                                    placeholder="Ex. 게이밍 마우스"
                                    error=${errors[`${idx}-title`]}
                                />
                            </div>

                            <div className="form-group mb-3 row align-items-center">
                                <label className="col-4 mb-0">분류</label>
                                <div className="col-8">
                                    <${CustomInput}
                                        name="type"
                                        value=${product.type}
                                        onChange=${(n, v) => handleChange(idx, n, v)}
                                        placeholder="Ex. 주변기기"
                                        error=${errors[`${idx}-type`]}
                                    />
                                </div>
                            </div>

                            <div className="form-group row align-items-center">
                                <label className="col-4 mb-0">판매가</label>
                                <div className="col-8">
                                    <${CustomInput}
                                        name="price"
                                        value=${product.price}
                                        onChange=${(n, v) => handleChange(idx, n, v)}
                                        placeholder="0"
                                        isPrice=${true}
                                        suffix="원"
                                        error=${errors[`${idx}-price`]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                `)}
            </div>
        </div>
    `;
}
