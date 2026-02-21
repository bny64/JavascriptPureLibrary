// utils/html-loader.js

const htmlCache = new Map();

/**
 * 지정된 URL의 HTML 컨텐츠를 비동기적으로 로드합니다.
 * 한 번 로드된 HTML은 캐시에 저장하여 중복 요청을 방지합니다.
 * @param {string} url - 로드할 HTML 파일의 경로
 * @returns {Promise<string>} HTML 컨텐츠를 담은 Promise
 */
async function loadHTML(url) {
    if (htmlCache.has(url)) {
        return htmlCache.get(url);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load HTML from ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        htmlCache.set(url, text);
        return text;
    } catch (error) {
        console.error(error);
        return `<p>Error loading content from ${url}.</p>`;
    }
}

/**
 * 여러 HTML 컴포넌트를 지정된 대상 요소에 주입합니다.
 * @param {string} targetSelector - HTML을 삽입할 부모 요소의 CSS 선택자
 * @param {Array<Object>} components - 로드할 컴포넌트 정보 배열. 예: [{id: 'taskModal', url: 'html/modals/task.html', wrapperClass: 'modal'}]
 */
export async function injectComponents(targetSelector, components) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element '${targetSelector}' not found.`);
        return;
    }

    const loadPromises = components.map(async (component) => {
        const content = await loadHTML(component.url);
        const wrapper = document.createElement('div');
        if (component.id) wrapper.id = component.id;
        if (component.wrapperClass) wrapper.className = component.wrapperClass;
        wrapper.innerHTML = content;
        return wrapper;
    });

    const loadedElements = await Promise.all(loadPromises);
    loadedElements.forEach(element => targetElement.appendChild(element));
}
