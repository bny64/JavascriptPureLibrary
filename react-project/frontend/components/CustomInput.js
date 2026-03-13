import html from '../lib/htmEngine.js';

const { useState, useEffect } = window.React;

export default function CustomInput({
    value,
    onChange,
    name,
    type = 'text',
    placeholder = '',
    isPrice = false,
    suffix = '',
    error = ''
}) {
    const [displayValue, setDisplayValue] = useState(value);

    // 내부 상태와 외부 props.value 동기화
    useEffect(() => {
        if (isPrice && value !== undefined && value !== null && value !== '') {
            const num = String(value).replace(/[^\d]/g, '');
            setDisplayValue(num.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        } else {
            setDisplayValue(value);
        }
    }, [value, isPrice]);

    const computedType = isPrice ? 'text' : type;

    const handleInput = (event) => {
        let val = event.target.value;
        if (isPrice) {
            const rawValue = val.replace(/[^\d]/g, '');
            const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            setDisplayValue(formatted); // 화면에는 콤마 있는 상태 유지

            const numValue = rawValue === '' ? '' : Number(rawValue);
            if (onChange) onChange(name, numValue);
        } else {
            setDisplayValue(val);
            if (onChange) onChange(name, val);
        }
    };

    return html`
        <div className="custom-input-wrapper">
            <div className="input-group">
                <input
                    type=${computedType}
                    value=${displayValue || ''}
                    className=${`custom-input ${error ? 'is-invalid' : ''} ${suffix ? 'has-suffix' : ''}`}
                    onInput=${handleInput}
                    placeholder=${placeholder}
                    name=${name}
                />
                ${suffix && html`<span className="input-suffix">${suffix}</span>`}
            </div>
            ${error && html`<span className="error-msg">${error}</span>`}
        </div>
    `;
}
