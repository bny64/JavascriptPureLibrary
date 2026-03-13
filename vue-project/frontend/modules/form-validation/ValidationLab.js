import UseFormType from './validation-dual-lab/UseFormType.js';
import UseFieldType from './validation-dual-lab/UseFieldType.js';
import UseFieldArrayType from './validation-dual-lab/UseFieldArrayType.js';

export default {
    components: {
        UseFormType,
        UseFieldType,
        UseFieldArrayType
    },
    template: `
        <div class="grid-2-col">
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent);">
                    <h3 style="font-size: 16px; color: var(--accent);">UseForm Type</h3>
                    <p style="font-size: 12px; color: var(--muted);">Centralized / Automatic</p>
                </div>
                <UseFormType />
            </div>
            
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent2);">
                    <h3 style="font-size: 16px; color: var(--accent2);">UseField Type</h3>
                    <p style="font-size: 12px; color: var(--muted);">Granular / Manual</p>
                </div>
                <UseFieldType />
            </div>

            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent3);">
                    <h3 style="font-size: 16px; color: var(--accent3);">UseFieldArray Type</h3>
                    <p style="font-size: 12px; color: var(--muted);">Dynamic Array Helper</p>
                </div>
                <UseFieldArrayType />
            </div>
        </div>
    `
};
