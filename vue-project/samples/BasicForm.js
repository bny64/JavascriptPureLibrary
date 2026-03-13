/* d:\workspace\JavascriptPureLibrary\vue-project\samples\BasicForm.js */
const BasicForm = {
    template: `
        <div class="page-wrap" style="max-width: 600px; margin: 0;">
            <div class="header" style="margin-bottom: 24px;">
                <h2 style="font-size: 20px; color: var(--text);">로그인 유효성 테스트</h2>
                <p style="font-family: 'DM Mono'; font-size: 11px; color: var(--muted);">v-model sync + Form-level validation</p>
            </div>
            
            <div style="background: var(--surface); padding: 32px; border: 1px solid var(--border); border-radius: 12px;">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 13px; color: var(--muted); margin-bottom: 8px;">이메일 주소</label>
                    <custom-input name="email" v-model="form.email" :rules="validateEmail" placeholder="example@domain.com" />
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 13px; color: var(--muted); margin-bottom: 8px;">비밀번호</label>
                    <custom-input name="password" type="password" v-model="form.password" :rules="validatePassword" placeholder="8자 이상 입력" />
                </div>
                
                <div style="margin-top: 32px;">
                    <button class="btn-submit" style="width: 100%;" @click="onLogin">로그인 시도</button>
                    <button class="btn btn-ghost" style="width: 100%; margin-top: 12px; justify-content: center;" @click="resetFormState">폼 초기화</button>
                </div>
            </div>
            
            <div v-if="submittedData" style="margin-top: 24px; padding: 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;">
                <h4 style="font-size: 12px; font-family: 'DM Mono'; color: var(--accent); margin-bottom: 8px;">SUBMITTED DATA:</h4>
                <pre style="font-size: 12px; color: var(--muted); overflow-x: auto;">{{ JSON.stringify(submittedData, null, 2) }}</pre>
            </div>
        </div>
    `,
    setup() {
        const { reactive, ref } = Vue;
        const { useForm } = VeeValidate;

        const { handleSubmit, resetForm } = useForm();
        const form = reactive({
            email: '',
            password: ''
        });
        const submittedData = ref(null);

        const validateEmail = (val) => {
            if (!val) return '이메일을 입력해주세요.';
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(val) ? true : '유효한 이메일 형식이 아닙니다.';
        };

        const validatePassword = (val) => {
            if (!val) return '비밀번호를 입력해주세요.';
            return val.length >= 8 ? true : '비밀번호는 최소 8자 이상이어야 합니다.';
        };

        const onLogin = handleSubmit((values) => {
            submittedData.value = values;
            console.log('Login attempt:', values);
        });

        const resetFormState = () => {
            resetForm();
            form.email = '';
            form.password = '';
            submittedData.value = null;
        };

        return {
            form, submittedData,
            validateEmail, validatePassword, onLogin, resetFormState
        };
    }
};
