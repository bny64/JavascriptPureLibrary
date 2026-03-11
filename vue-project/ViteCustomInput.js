import { computed } from 'vue';
import { useField } from 'vee-validate';

/**
 * ViteCustomInput (Vite + Vue 3.4+ SFC 기반 예시)
 * - defineModel() 매크로를 사용하여 양방향 바인딩을 처리하는 버전입니다.
 * - 실제 SFC(.vue) 파일의 <script setup> 내부 로직으로 이해하시면 됩니다.
 */

// props 정의
const props = defineProps({
    name: { type: String, required: true },
    type: { type: String, default: 'text' },
    rules: { type: Function, default: null },
    placeholder: { type: String, default: '' },
    isPrice: { type: Boolean, default: false }
});

// Vue 3.4+ 양방향 바인딩 매크로
const modelValue = defineModel();

// VeeValidate 필드 설정
const { value, errorMessage, validate, handleBlur, handleChange } = useField(
    () => props.name,
    props.rules,
    {
        // validateOnValueUpdate: false, // 여전히 blur 시 검증을 위해 false 유지
        syncVModel: true              // defineModel과 자동으로 동기화
    }
);

// 가격 타입일 경우 표시 타입 제어
const computedType = computed(() => props.isPrice ? 'text' : props.type);

// 콤마가 포함된 표시용 값 (Getter)
const displayValue = computed(() => {
    if (props.isPrice && value.value != null && value.value !== '') {
        const num = String(value.value).replace(/[^\d]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return value.value;
});

// 입력 처리 (Setter 역할)
const handleInput = (event) => {
    const val = event.target.value;
    if (props.isPrice) {
        const rawValue = val.replace(/[^\d]/g, '');
        const numValue = rawValue === '' ? '' : Number(rawValue);
        handleChange(numValue, false);
        modelValue.value = numValue; // 부모 데이터 업데이트
    } else {
        handleChange(val, false);
        modelValue.value = val;
    }
};

// Blur 시 유효성 검사 실행
const onBlur = async (event) => {
    handleBlur(event);
    if (props.rules) await validate();
};

/* <template> 영역 */
/*
<template>
  <div class="custom-input-wrapper">
    <input
      :type="computedType"
      :value="displayValue"
      :class="['custom-input', { 'is-invalid': errorMessage }]"
      @input="handleInput"
      @blur="onBlur"
      :placeholder="placeholder"
    />
    <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
  </div>
</template>
*/

/* <style scoped> 영역 */
/*
<style scoped>
.custom-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.custom-input {
  width: 100%;
  padding: 8px 11px;
  /* ... 기타 스타일은 style.css 참조 ... */
}
</style >
*/
