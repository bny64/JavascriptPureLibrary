import UseFormType from './validation-dual-lab/UseFormType.js';
import UseFieldType from './validation-dual-lab/UseFieldType.js';

export default {
    components: {
        UseFormType,
        UseFieldType
    },
    template: `
        <div class="grid-2-col">
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent);">
                    <h3 style="font-size: 16px; color: var(--accent);">UseForm Type</h3>
                    <p style="font-size: 12px; color: var(--muted);">Primary validation testing</p>
                </div>
                <UseFormType />
            </div>
            
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent2);">
                    <h3 style="font-size: 16px; color: var(--accent2);">UseField Type</h3>
                    <p style="font-size: 12px; color: var(--muted);">Extended / Comparison testing</p>
                </div>
                <UseFieldType />
            </div>
        </div>
    `
};
