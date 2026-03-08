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
    },
    emits: ['update:modelValue'],
    template: `
        <div class="custom-input-wrapper">
            <input
                :type="type"
                :value="value"
                :class="['custom-input', { 'is-invalid': errorMessage }]"
                @input="onInput"
                @blur="onBlur"
                :placeholder="placeholder"
            />
            <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
        </div>
    `,
    setup(props, { emit }) {
        const { useField } = VeeValidate;

        const { value, errorMessage, handleBlur, handleChange, validate } = useField(
            () => props.name,
            props.rules,
            {
                initialValue: props.modelValue ?? '',
                validateOnValueUpdate: false,
            }
        );

        const onInput = (e) => {
            const newVal = e.target.value;
            handleChange(newVal, false);
            emit('update:modelValue', newVal);
        };

        const onBlur = async (e) => {
            handleBlur(e);
            if (props.rules) await validate();
        };

        return { value, errorMessage, onInput, onBlur };
    }
};