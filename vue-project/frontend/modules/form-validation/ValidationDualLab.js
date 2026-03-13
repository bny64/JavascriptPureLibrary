import RegistryAlpha from './validation-dual-lab/RegistryAlpha.js';
import RegistryBeta from './validation-dual-lab/RegistryBeta.js';

export default {
    components: {
        RegistryAlpha,
        RegistryBeta
    },
    template: `
        <div class="grid-2-col">
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent);">
                    <h3 style="font-size: 16px; color: var(--accent);">Registry Alpha</h3>
                    <p style="font-size: 12px; color: var(--muted);">Primary validation testing</p>
                </div>
                <RegistryAlpha />
            </div>
            
            <div class="lab-column">
                <div class="column-header" style="margin-bottom: 20px; padding: 10px; border-bottom: 2px solid var(--accent2);">
                    <h3 style="font-size: 16px; color: var(--accent2);">Registry Beta</h3>
                    <p style="font-size: 12px; color: var(--muted);">Extended / Comparison testing</p>
                </div>
                <RegistryBeta />
            </div>
        </div>
    `
};
