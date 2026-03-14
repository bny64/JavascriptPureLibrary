/* d:\workspace\JavascriptPureLibrary\vue-project\samples\BasicForm.js */
export default {
    template: `
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
        <div class="page-wrap" style="max-width: 800px; margin: 0 auto; padding: 20px;">

            <div class="header" style="margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                <h2 style="font-size: 24px; font-weight: 700; color: var(--text); margin-bottom: 8px;">
                    실무형 폼 유효성 검사
                </h2>
                <p style="font-family: 'DM Mono'; font-size: 13px; color: var(--muted); letter-spacing: -0.02em;">
                    Vee-Validate + Custom Components Integration
                </p>
            </div>

            <form class="card" @submit.prevent="onSave">
                <div class="card-header" style="padding: 24px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02);">
                    <h3 style="font-size: 18px; font-weight: 600; color: var(--text);">계정 정보 설정</h3>
                    <p style="font-size: 13px; color: var(--muted); margin-top: 4px;">사용자 등록을 위한 필수 정보를 입력해주세요.</p>
                </div>

                <div class="card-content" style="padding: 32px;">
                    <div class="form-grid">
                        <!-- 사용자 이름 필드 -->
                        <div class="form-row">
                            <label class="form-label-side">
                                사용자 이름 <span style="color: var(--error); margin-left: 4px;">*</span>
                            </label>
                            <div class="form-input-control">
                                <custom-input
                                    name="username"
                                    v-model="form.username"
                                    :rules="validateUsername"
                                    placeholder="홍길동"
                                />
                                <p style="font-size: 11px; color: var(--muted); margin-top: 8px;">공개 프로필에 표시될 이름입니다.</p>
                            </div>
                        </div>

                        <!-- 이메일 필드 -->
                        <div class="form-row">
                            <label class="form-label-side">
                                이메일 주소 <span style="color: var(--error); margin-left: 4px;">*</span>
                            </label>
                            <div class="form-input-control">
                                <custom-input
                                    name="email"
                                    type="email"
                                    v-model="form.email"
                                    :rules="validateEmail"
                                    placeholder="example@domain.com"
                                />
                            </div>
                        </div>

                        <!-- 나이 필드 -->
                        <div class="form-row">
                            <label class="form-label-side">
                                사용자 나이 <span style="color: var(--error); margin-left: 4px;">*</span>
                            </label>
                            <div class="form-input-control">
                                <custom-input
                                    name="age"
                                    type="number"
                                    v-model="form.age"
                                    :rules="validateAge"
                                    placeholder="18"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding: 32px; border-top: 1px solid var(--border); background: rgba(255, 255, 255, 0.01); display: flex; justify-content: center; align-items: center; gap: 16px; width: 100%; box-sizing: border-box;">
                    <button type="button" class="btn btn-ghost" @click="onReset" style="min-width: 120px; height: 44px; justify-content: center;">초기화</button>
                    <button type="submit" class="btn btn-primary" style="min-width: 160px; height: 44px; font-weight: 700; justify-content: center;">저장하기</button>
                </div>
            </form>
        </div>
    `,
    setup() {
        const { reactive } = Vue;
        const { useForm } = VeeValidate;

        const { handleSubmit, resetForm } = useForm();
        const form = reactive({
            username: '',
            email: '',
            age: ''
        });

        const validateUsername = (val) => {
            if (!val) return '사용자 이름은 필수입니다.';
            if (val.length < 3) return '최소 3글자 이상 입력해주세요.';
            return true;
        };

        const validateEmail = (val) => {
            if (!val) return '이메일은 필수입니다.';
            const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
            return regex.test(val) ? true : '유효한 이메일 형식이 아닙니다.';
        };

        const validateAge = (val) => {
            if (!val) return '나이를 입력해주세요.';
            const num = Number(val);
            if (num < 18) return '만 18세 이상만 가입 가능합니다.';
            if (num > 99) return '99세 이하로 입력해주세요.';
            return true;
        };

        const onSave = handleSubmit((values) => {
            alert('Vee-Validate 유효성 검사 통과 및 제출:\n\n' + JSON.stringify(values, null, 2));
        });

        const onReset = () => {
            resetForm();
            form.username = '';
            form.email = '';
            form.age = '';
        };

        return {
            form,
            validateUsername,
            validateEmail,
            validateAge,
            onSave,
            onReset
        };
    }
};
