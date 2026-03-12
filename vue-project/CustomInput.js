/**
 * CustomInput
 * - VeeValidate useField 기반 입력 컴포넌트
 * - blur 시에만 유효성 검증
 * - 에러/값 초기화는 부모의 useForm > resetForm() 으로 처리
 */
const CustomInput = {
    props: {
        modelValue: { default: '' },
        name: { type: String, required: true },
        type: { type: String, default: 'text' },
        rules: { type: Function, default: null },
        placeholder: { type: String, default: '' },
        isPrice: { type: Boolean, default: false },
        suffix: { type: String, default: '' }
    },
    emits: ['update:modelValue'],
    template: `
        <div class="custom-input-wrapper">
            <div class="input-group">
                <input
                    :type="computedType"
                    :value="displayValue"
                    :class="['custom-input', { 'is-invalid': errorMessage, 'has-suffix': suffix }]"
                    @input="handleInput"
                    @blur="onBlur"
                    :placeholder="placeholder"
                />
                <span v-if="suffix" class="input-suffix">{{ suffix }}</span>
            </div>
            <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
        </div>
    `,
    setup(props, { emit }) {
        const { useField } = VeeValidate;
        const { computed } = Vue;

        // useField를 사용하여 상위 useForm 컨텍스트에 필드를 등록합니다.
        const { value, errorMessage, validate, handleBlur, handleChange } = useField(
            () => props.name,
            props.rules,
            {
                // validateOnValueUpdate: false, // 입력/프로그래밍적 값 업데이트 시 검증하지 않음
                syncVModel: true
            }
        );

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
                // 숫자 이외의 문자 제거
                const rawValue = val.replace(/[^\d]/g, '');

                // 화면상에도 숫자와 콤마만 나타나도록 입력창 값을 강제로 업데이트
                // (Vue의 리액티브 데이터가 변하지 않아도 DOM을 직접 수정하여 즉각적인 피드백 제공)
                const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                event.target.value = formatted;

                const numValue = rawValue === '' ? '' : Number(rawValue);
                emit('update:modelValue', numValue);
            } else {
                handleChange(val, false);
                emit('update:modelValue', val);
            }
        };

        // 포커스를 잃었을 때 검증 실행
        const onBlur = async (event) => {
            handleBlur(event);
            if (props.rules) {
                await validate();
            }
        };

        return {
            value,
            errorMessage,
            computedType,
            displayValue,
            handleInput,
            onBlur
        };
    }
};