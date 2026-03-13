import html from '../../../lib/htmEngine.js';
import CustomInput from '../../../components/CustomInput.js';

const { useState } = window.React;
const { useForm, useFieldArray, Controller } = window.ReactHookForm;

/**
 * UseFieldArrayType (Advanced RHF FieldArray)
 * Focuses on useFieldArray built-in methods like swap, insert, etc.
 */
export default function UseFieldArrayType() {
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

    const { fields, append, remove, swap, insert } = useFieldArray({
        control,
        name: "products"
    });

    const addProducts = () => {
        const newItems = [];
        for (let i = 0; i < addCount; i++) {
            const randomFullPrice = Math.floor(Math.random() * 91 + 10) * 10000;
            newItems.push({
                id: Date.now() + Math.random(),
                date: '', name: '', price: '',
                priceType: 'amount', fullPrice: randomFullPrice
            });
        }
        append(newItems);
        setAddCount(1);
    };

    const onSubmit = (data) => {
        console.log('FieldArray Submit:', data);
        alert('useFieldArray 특화 제출 성공!');
    };

    return html`
        <div className="page-wrap" style=${{ maxWidth: '100%' }}>
            <div className="toolbar">
                <span className="badge">${fields.length}</span>
                <span style=${{ fontSize: '13px', color: 'var(--muted)' }}>개 상품 (Advanced Array)</span>
                <div className="toolbar-right">
                    <div className="count-wrap">
                        <label>수량</label>
                        <input className="count-input" type="number" value=${addCount} onInput=${e => setAddCount(parseInt(e.target.value) || 1)} min="1" max="20" />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick=${addProducts}>추가</button>
                    <button className="btn btn-ghost btn-sm" onClick=${() => reset({ products: [] })} disabled=${fields.length === 0}>초기화</button>
                </div>
            </div>

            ${fields.length > 0 ? html`
                <div>
                    <div className="list-header" style=${{ gridTemplateColumns: '40px 1.2fr 2fr 1.8fr 80px' }}>
                        <div>#</div>
                        <div>날짜</div>
                        <div>상품명</div>
                        <div>가격</div>
                        <div>액션</div>
                    </div>
                    <div>
                        ${fields.map((field, index) => html`
                            <div className="product-row" key=${field.id} style=${{ gridTemplateColumns: '40px 1.2fr 2fr 1.8fr 80px' }}>
                                <div className="row-num">${index + 1}</div>
                                <div>
                                    <${Controller}
                                        name=${`products.${index}.date`}
                                        control=${control}
                                        rules=${{ required: '필수' }}
                                        render=${({ field: rhfField, fieldState: { error } }) => html`
                                            <${CustomInput} name=${rhfField.name} type="date" value=${rhfField.value} onChange=${(n, v) => rhfField.onChange(v)} onBlur=${() => { rhfField.onBlur(); trigger(`products.${index}.date`); }} error=${error?.message} />
                                        `}
                                    />
                                </div>
                                <div>
                                    <${Controller}
                                        name=${`products.${index}.name`}
                                        control=${control}
                                        rules=${{ required: '필수' }}
                                        render=${({ field: rhfField, fieldState: { error } }) => html`
                                            <${CustomInput} name=${rhfField.name} value=${rhfField.value} onChange=${(n, v) => rhfField.onChange(v)} onBlur=${() => { rhfField.onBlur(); trigger(`products.${index}.name`); }} error=${error?.message} />
                                        `}
                                    />
                                </div>
                                <div className="price-container">
                                    <${Controller}
                                        name=${`products.${index}.price`}
                                        control=${control}
                                        rules=${{ required: '필수' }}
                                        render=${({ field: rhfField, fieldState: { error } }) => html`
                                            <${CustomInput} name=${rhfField.name} isPrice=${true} suffix="원" value=${rhfField.value} onChange=${(n, v) => rhfField.onChange(v)} onBlur=${() => { rhfField.onBlur(); trigger(`products.${index}.price`); }} error=${error?.message} />
                                        `}
                                    />
                                </div>
                                <div className="row-del" style=${{ gap: '4px' }}>
                                    <button className="btn-icon" onClick=${() => index > 0 && swap(index, index - 1)} disabled=${index === 0}>↑</button>
                                    <button className="btn-icon" onClick=${() => remove(index)}>×</button>
                                </div>
                            </div>
                        `)}
                    </div>
                    <div className="submit-area">
                        <button className="btn-submit" onClick=${handleSubmit(onSubmit)} style=${{ background: 'var(--accent3)' }}>
                            FieldArray Submission
                        </button>
                    </div>
                </div>
            ` : html`
                <div className="empty-state">
                    <div className="icon">📋</div>
                    <p>리스트가 비어있습니다.</p>
                </div>
            `}
        </div>
    `;
}
