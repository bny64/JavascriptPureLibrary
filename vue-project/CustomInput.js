const CustomInput = {
    props: ['modelValue', 'name', 'type', 'rules', 'placeholder'],
    template: `
        <div>
            <input 
                :type="type"
                v-model="value"
                :class="['custom-input', { 'is-invalid': errorMessage }]"
                @blur="onCustomBlur"
                :placeholder="placeholder"
            >
            <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
        </div>
    `,
    setup(props) {
        // 전역 스코프 충돌 방지를 위해 컴포넌트 내부에서 참조
        const { useField } = VeeValidate;

        // useField를 사용하여 상위 useForm 컨텍스트에 필드를 등록합니다.
        // syncVModel: true 옵션을 사용하여 v-model(modelValue)과 자동으로 동기화합니다.
        const { value, errorMessage, validate } = useField(() => props.name, props.rules, {
            initialValue: props.modelValue,
            syncVModel: true
        });

        // 사용자가 아무것도 입력하지 않고 단순히 포커스만 잃었을 때도
        // 강제로 검증을 실행하여 에러 메시지를 노출합니다.
        const onCustomBlur = async (event) => {
            // 삭제 버튼이나 초기화 버튼을 눌러서 포커스가 이동하는 경우 검증 생략 (깜빡임 방지)
            const target = event.relatedTarget;
            if (target && (
                target.classList.contains('btn-remove') ||
                target.classList.contains('btn-reset') ||
                target.classList.contains('btn-clear')
            )) {
                return;
            }
            await validate();
        };

        return {
            value,
            errorMessage,
            onCustomBlur
        };
    }
};
