import html from '../../../lib/htmEngine.js';
import CustomInput from '../../../core/components/CustomInput.js';

const { useState } = window.React;
// ReactHookForm (UMD global)
const { useForm, Controller } = window.ReactHookForm;

export default function FormValidationSample() {
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        defaultValues: {
            username: '',
            email: '',
            age: ''
        },
        mode: 'onTouched' // change on blur
    });

    const onSubmit = (data) => {
        alert('React-Hook-Form 유효성 검사 통과 및 제출:\n\n' + JSON.stringify(data, null, 2));
    };

    return html`
        <style>
            .card-footer-center {
                padding: 32px;
                border-top: 1px solid var(--border);
                background: rgba(255, 255, 255, 0.01);
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                gap: 16px;
                width: 100%;
            }
            .form-row {
                display: flex;
                align-items: flex-start;
                margin-bottom: 24px;
            }
            .form-label-side {
                width: 30%;
                font-weight: 500;
                padding-top: 12px;
                color: var(--text);
            }
            .form-input-control {
                width: 70%;
            }
        </style>
        <div className="page-wrap" style=${{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

            <div className="header" style=${{ marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <h2 style=${{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                    실무형 폼 유효성 검사
                </h2>
                <p style=${{ fontFamily: 'DM Mono', fontSize: '13px', color: 'var(--muted)', letterSpacing: '-0.02em' }}>
                    React Hook Form + Custom Components Integration
                </p>
            </div>

            <form className="card" onSubmit=${handleSubmit(onSubmit)}>
                <div className="card-header" style=${{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style=${{ fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>계정 정보 설정</h3>
                    <p style=${{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>사용자 등록을 위한 필수 정보를 입력해주세요.</p>
                </div>

                <div className="card-content" style=${{ padding: '32px' }}>
                    <div className="form-grid">
                        <!-- 사용자 이름 필드 -->
                        <div className="form-row">
                            <label className="form-label-side">
                                사용자 이름 <span style=${{ color: 'var(--error)', marginLeft: '4px' }}>*</span>
                            </label>
                            <div className="form-input-control">
                                <${Controller}
                                    name="username"
                                    control=${control}
                                    rules=${{
            required: '사용자 이름은 필수입니다.',
            minLength: { value: 3, message: '최소 3글자 이상 입력해주세요.' }
        }}
                                    render=${({ field: { onChange, onBlur, value } }) => html`
                                        <${CustomInput}
                                            name="username"
                                            value=${value}
                                            onChange=${(name, val) => onChange(val)}
                                            onBlur=${onBlur}
                                            placeholder="홍길동"
                                            error=${errors.username?.message}
                                        />
                                    `}
                                />
                                <p style=${{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>공개 프로필에 표시될 이름입니다.</p>
                            </div>
                        </div>

                        <!-- 이메일 필드 -->
                        <div className="form-row">
                            <label className="form-label-side">
                                이메일 주소 <span style=${{ color: 'var(--error)', marginLeft: '4px' }}>*</span>
                            </label>
                            <div className="form-input-control">
                                <${Controller}
                                    name="email"
                                    control=${control}
                                    rules=${{
            required: '이메일은 필수입니다.',
            pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                message: '유효한 이메일 형식이 아닙니다.'
            }
        }}
                                    render=${({ field: { onChange, onBlur, value } }) => html`
                                        <${CustomInput}
                                            name="email"
                                            type="email"
                                            value=${value}
                                            onChange=${(name, val) => onChange(val)}
                                            onBlur=${onBlur}
                                            placeholder="example@domain.com"
                                            error=${errors.email?.message}
                                        />
                                    `}
                                />
                            </div>
                        </div>

                        <!-- 나이 필드 -->
                        <div className="form-row">
                            <label className="form-label-side">
                                사용자 나이 <span style=${{ color: 'var(--error)', marginLeft: '4px' }}>*</span>
                            </label>
                            <div className="form-input-control">
                                <${Controller}
                                    name="age"
                                    control=${control}
                                    rules=${{
            required: '나이를 입력해주세요.',
            min: { value: 18, message: '만 18세 이상만 가입 가능합니다.' },
            max: { value: 99, message: '99세 이하로 입력해주세요.' }
        }}
                                    render=${({ field: { onChange, onBlur, value } }) => html`
                                        <${CustomInput}
                                            name="age"
                                            type="number"
                                            value=${value}
                                            onChange=${(name, val) => onChange(val)}
                                            onBlur=${onBlur}
                                            placeholder="18"
                                            error=${errors.age?.message}
                                        />
                                    `}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style=${{ padding: '32px', borderTop: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                    <button type="button" className="btn btn-ghost" onClick=${() => reset()} style=${{ minWidth: '120px', height: '44px', textAlign: 'center' }}>초기화</button>
                    <button type="submit" className="btn btn-primary" style=${{ minWidth: '160px', height: '44px', fontWeight: '700' }}>저장하기</button>
                </div>
            </form>
        </div>
    `;
}
