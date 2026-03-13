// modules/category-modal.js - 카테고리 모달 관련 기능

import { DomUtils } from '../utils/dom.js';
import { CategoryService } from '../services/category-service.js';

export function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    resetCategoryForm();
    CategoryService.loadCategories();
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    DomUtils.scrollToTop(modal.querySelector('.modal-content'));
}

export function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

export function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
}

export function editCategoryItem(category) {
    document.getElementById('categoryId').value = category.id;
    document.getElementById('mainCategory').value = category.mainCategory;
    document.getElementById('subCategory').value = category.subCategory || '';
    document.getElementById('detailCategory').value = category.detailCategory || '';
}

export async function saveCategory(event) {
    event.preventDefault();

    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        mainCategory: document.getElementById('mainCategory').value,
        subCategory: document.getElementById('subCategory').value || '',
        detailCategory: document.getElementById('detailCategory').value || ''
    };

    if (categoryId) {
        await CategoryService.updateCategory(categoryId, categoryData);
    } else {
        await CategoryService.createCategory(categoryData);
    }

    resetCategoryForm();
}
