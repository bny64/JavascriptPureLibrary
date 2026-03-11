const CustomInput = {
    props: ['modelValue', 'name', 'type', 'rules', 'placeholder', 'isPrice'],
    template: `
        <div>
            <input 
                :type="computedType"
                :value="displayValue"
                @input="handleInput"
                :class="['custom-input', { 'is-invalid': errorMessage }]"
                @blur="onCustomBlur"
                :placeholder="placeholder"
            >
            <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
        </div>
    `,
    setup(props) {
        const { useField } = VeeValidate;
        const { computed } = Vue;

        // useField를 사용하여 상위 useForm 컨텍스트에 필드를 등록합니다.
        const { value, errorMessage, validate } = useField(() => props.name, props.rules, {
            syncVModel: true
        });

        // 가격 타입일 경우 콤마 표시를 위해 text 타입으로 처리
        const computedType = computed(() => props.isPrice ? 'text' : props.type);

        // 표시용 값: 가격일 경우 3자리마다 콤마 추가
        const displayValue = computed(() => {
            if (props.isPrice && value.value !== undefined && value.value !== null && value.value !== '') {
                const num = String(value.value).replace(/[^\d]/g, '');
                return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return value.value;
        });

        // 입력 처리: 콤마 제거 후 숫자만 내부 값으로 저장
        const handleInput = (event) => {
            let val = event.target.value;
            if (props.isPrice) {
                const rawValue = val.replace(/[^\d]/g, '');
                value.value = rawValue === '' ? '' : Number(rawValue);
            } else {
                value.value = val;
            }
        };

        // 사용자가 아무것도 입력하지 않고 단순히 포커스만 잃었을 때도
        // 강제로 검증을 실행하여 에러 메시지를 노출합니다.
        const onCustomBlur = async (event) => {
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
            computedType,
            displayValue,
            handleInput,
            onCustomBlur
        };
    }
};
