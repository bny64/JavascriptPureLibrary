import UseFormType from './validation-dual-lab/UseFormType.js';
import UseFieldType from './validation-dual-lab/UseFieldType.js';
import UseFieldArrayType from './validation-dual-lab/UseFieldArrayType.js';
import UseGroupType from './validation-dual-lab/UseGroupType.js';

export default {
    components: {
        UseFormType,
        UseFieldType,
        UseFieldArrayType,
        UseGroupType
    },
    template: `
        <div class="validation-lab-container">
            <div class="header" style="margin-bottom: 40px;">
                <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 12px;">
                    Validation Laboratory <span style="color: var(--accent); font-size: 18px; font-weight: 400; margin-left: 8px;">(Vue)</span>
                </h1>
                <p style="color: var(--muted); font-size: 14px; line-height: 1.6; max-width: 800px;">
                    Vee-Validate의 <span style="color: var(--text);">useForm</span>, 
                    <span style="color: var(--text);">reactive</span> 상태를 이용한 수동 검증, 
                    <span style="color: var(--text);">useFieldArray</span>를 활용한 동적 배열,
                    그리고 <span style="color: var(--text);">validateField</span>를 이용한 그룹 검증 전략을 한눈에 비교합니다.
                </p>
            </div>

            <div class="grid-2-col" style="align-items: flex-start; gap: 40px;">
                <!-- Approach 1: useForm -->
                <div class="lab-section">
                    <div class="section-header" style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; color: var(--accent);">01. Standard useForm</h2>
                        <p style="font-size: 12px; color: var(--muted);">Vee-Validate 권장 방식 (useForm)</p>
                    </div>
                    <UseFormType />
                </div>
                
                <!-- Approach 2: Manual State -->
                <div class="lab-section">
                    <div class="section-header" style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; color: var(--accent2);">02. Manual Validation</h2>
                        <p style="font-size: 12px; color: var(--muted);">reactive 기반 직접 상태 제어</p>
                    </div>
                    <UseFieldType />
                </div>

                <!-- Approach 3: useFieldArray -->
                <div class="lab-section">
                    <div class="section-header" style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; color: var(--accent3);">03. useFieldArray Focus</h2>
                        <p style="font-size: 12px; color: var(--muted);">동적 배열 특화 기능 활용</p>
                    </div>
                    <UseFieldArrayType />
                </div>

                <!-- Approach 4: Group Validation -->
                <div class="lab-section">
                    <div class="section-header" style="margin-bottom: 20px;">
                        <h2 style="font-size: 18px; color: var(--accent4, #f59e0b);">04. Group Validation</h2>
                        <p style="font-size: 12px; color: var(--muted);">validateField 기반 부분 검증</p>
                    </div>
                    <UseGroupType />
                </div>
            </div>
        </div>
    `
};
