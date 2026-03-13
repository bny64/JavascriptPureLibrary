import html from '../../lib/htmEngine.js';
import UseFormType from './validation-lab/UseFormType.js';
import UseFieldType from './validation-lab/UseFieldType.js';
import UseFieldArrayType from './validation-lab/UseFieldArrayType.js';

/**
 * ValidationLab (React version)
 * Integrated lab for comparing different validation strategies.
 */
export default function ValidationLab() {
    return html`
        <div className="validation-lab-container">
            <div className="header" style=${{ marginBottom: '40px' }}>
                <h1 style=${{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '12px' }}>
                    Validation Laboratory <span style=${{ color: 'var(--accent)', fontSize: '18px', fontWeight: '400', marginLeft: '8px' }}>(React)</span>
                </h1>
                <p style=${{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', maxWidth: '800px' }}>
                    React Hook Form의 <span style=${{ color: 'var(--text)' }}>useForm</span>, 
                    표준 <span style=${{ color: 'var(--text)' }}>useState</span>를 이용한 수동 검증, 
                    그리고 <span style=${{ color: 'var(--text)' }}>useFieldArray</span>를 활용한 동적 배열 관리 방식을 한눈에 비교합니다.
                </p>
            </div>

            <div className="grid-2-col" style=${{ alignItems: 'flex-start', gap: '40px' }}>
                <!-- Approach 1: useForm (Standard) -->
                <div className="lab-section">
                    <div className="section-header" style=${{ marginBottom: '20px' }}>
                        <h2 style=${{ fontSize: '18px', color: 'var(--accent)' }}>01. Standard useForm</h2>
                        <p style=${{ fontSize: '12px', color: 'var(--muted)' }}>React Hook Form 권장 방식</p>
                    </div>
                    <${UseFormType} />
                </div>

                <!-- Approach 2: Manual State (Control) -->
                <div className="lab-section">
                    <div className="section-header" style=${{ marginBottom: '20px' }}>
                        <h2 style=${{ fontSize: '18px', color: 'var(--accent2)' }}>02. Manual Validation</h2>
                        <p style=${{ fontSize: '12px', color: 'var(--muted)' }}>useState 기반 직접 상태 제어</p>
                    </div>
                    <${UseFieldType} />
                </div>

                <!-- Approach 3: useFieldArray (Array management) -->
                <div className="lab-section">
                    <div className="section-header" style=${{ marginBottom: '20px' }}>
                        <h2 style=${{ fontSize: '18px', color: 'var(--accent3)' }}>03. useFieldArray Focus</h2>
                        <p style=${{ fontSize: '12px', color: 'var(--muted)' }}>동적 배열 특화 기능 활용</p>
                    </div>
                    <${UseFieldArrayType} />
                </div>
            </div>
        </div>
    `;
}
