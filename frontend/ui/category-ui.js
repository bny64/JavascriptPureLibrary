// ui/category-ui.js - 카테고리 트리 UI 렌더링

import { DomUtils } from '../utils/dom.js';

export const CategoryUI = {
    renderTree(categories) {
        const treeView = document.getElementById('categoryTreeView');
        if (!treeView) return;

        if (categories.length === 0) {
            treeView.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">등록된 분류가 없습니다.</p>';
            return;
        }

        const grouped = {};
        const mainCategories = new Set();

        categories.forEach(cat => {
            mainCategories.add(cat.mainCategory);
            if (!grouped[cat.mainCategory]) {
                grouped[cat.mainCategory] = { main: null, subs: {} };
            }
            if (cat.subCategory) {
                if (!grouped[cat.mainCategory].subs[cat.subCategory]) {
                    grouped[cat.mainCategory].subs[cat.subCategory] = { sub: null, details: [] };
                }
                if (cat.detailCategory) {
                    grouped[cat.mainCategory].subs[cat.subCategory].details.push(cat);
                } else {
                    grouped[cat.mainCategory].subs[cat.subCategory].sub = cat;
                }
            } else if (!cat.detailCategory) {
                grouped[cat.mainCategory].main = cat;
            }
        });

        treeView.innerHTML = '';
        Array.from(mainCategories).sort().forEach(mainCat => {
            treeView.appendChild(this._createTreeItem(mainCat, grouped[mainCat]));
        });
    },

    _createTreeItem(mainCat, group) {
        const itemDiv = DomUtils.createElement('div', 'category-tree-item');

        // 대분류
        const mainDiv = DomUtils.createElement('div', 'category-main');
        mainDiv.appendChild(DomUtils.createElement('span', '', mainCat));
        const actions = DomUtils.createElement('div', 'category-actions');
        if (group.main) {
            actions.appendChild(this._createCatBtn('btn-cat-edit', '수정', async () => {
                const { editCategoryItem } = await import('../modules/category-modal.js');
                editCategoryItem(group.main);
            }));
            actions.appendChild(this._createCatBtn('btn-cat-copy', '복사', async () => {
                const { copyCategory } = await import('../main.js');
                copyCategory(group.main);
            }));
            actions.appendChild(this._createCatBtn('btn-cat-delete', '삭제', async () => {
                const { CategoryService } = await import('../services/category-service.js');
                CategoryService.deleteCategory(group.main.id);
            }));
        }
        mainDiv.appendChild(actions);
        itemDiv.appendChild(mainDiv);

        // 중분류
        Object.keys(group.subs).sort().forEach(subKey => {
            const subGroup = group.subs[subKey];
            const subDiv = DomUtils.createElement('div', 'category-sub');
            subDiv.appendChild(DomUtils.createElement('span', '', `└ ${subKey}`));
            const subActions = DomUtils.createElement('div', 'category-actions');
            if (subGroup.sub) {
                subActions.appendChild(this._createCatBtn('btn-cat-edit', '수정', async () => {
                    const { editCategoryItem } = await import('../modules/category-modal.js');
                    editCategoryItem(subGroup.sub);
                }));
                subActions.appendChild(this._createCatBtn('btn-cat-copy', '복사', async () => {
                    const { copyCategory } = await import('../main.js');
                    copyCategory(subGroup.sub);
                }));
                subActions.appendChild(this._createCatBtn('btn-cat-delete', '삭제', async () => {
                    const { CategoryService } = await import('../services/category-service.js');
                    CategoryService.deleteCategory(subGroup.sub.id);
                }));
            }
            subDiv.appendChild(subActions);
            itemDiv.appendChild(subDiv);

            // 소분류
            subGroup.details
                .sort((a, b) => a.detailCategory.localeCompare(b.detailCategory))
                .forEach(detailCat => {
                    const detailDiv = DomUtils.createElement('div', 'category-detail');
                    detailDiv.appendChild(DomUtils.createElement('span', '', `    └ ${detailCat.detailCategory}`));
                    const detailActions = DomUtils.createElement('div', 'category-actions');
                    detailActions.appendChild(this._createCatBtn('btn-cat-edit', '수정', async () => {
                        const { editCategoryItem } = await import('../modules/category-modal.js');
                        editCategoryItem(detailCat);
                    }));
                    detailActions.appendChild(this._createCatBtn('btn-cat-copy', '복사', async () => {
                        const { copyCategory } = await import('../main.js');
                        copyCategory(detailCat);
                    }));
                    detailActions.appendChild(this._createCatBtn('btn-cat-delete', '삭제', async () => {
                        const { CategoryService } = await import('../services/category-service.js');
                        CategoryService.deleteCategory(detailCat.id);
                    }));
                    detailDiv.appendChild(detailActions);
                    itemDiv.appendChild(detailDiv);
                });
        });

        return itemDiv;
    },

    _createCatBtn(className, text, handler) {
        const btn = DomUtils.createElement('button', className, text);
        btn.addEventListener('click', handler);
        return btn;
    }
};
