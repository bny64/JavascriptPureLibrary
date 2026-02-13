// ui.js - UI 렌더링 모듈

const UI = {
    // 캘린더 렌더링
    calendar: {
        render: function(tasks, currentDate, selectedDate, holidays) {
            const calendar = document.getElementById('calendar');
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            document.getElementById('currentMonth').textContent = `${year}년 ${month + 1}월`;
            
            calendar.innerHTML = '';
            
            // 요일 헤더
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            weekdays.forEach(day => {
                const dayHeader = DomUtils.createElement('div', 'calendar-day header', day);
                calendar.appendChild(dayHeader);
            });
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const prevLastDay = new Date(year, month, 0);
            
            // 이전 달
            const firstDayOfWeek = firstDay.getDay();
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const day = prevLastDay.getDate() - i;
                const dayDiv = this.createDayElement(
                    new Date(year, month - 1, day),
                    true,
                    tasks,
                    selectedDate,
                    holidays
                );
                calendar.appendChild(dayDiv);
            }
            
            // 현재 달
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(year, month, day);
                const dayDiv = this.createDayElement(date, false, tasks, selectedDate, holidays);
                calendar.appendChild(dayDiv);
            }
            
            // 다음 달
            const remainingDays = 42 - calendar.children.length + 7;
            for (let day = 1; day <= remainingDays; day++) {
                const dayDiv = this.createDayElement(
                    new Date(year, month + 1, day),
                    true,
                    tasks,
                    selectedDate,
                    holidays
                );
                calendar.appendChild(dayDiv);
            }
        },
        
        createDayElement: function(date, isOtherMonth, tasks, selectedDate, holidays) { // Added holidays parameter
            const dayDiv = DomUtils.createElement('div', 'calendar-day');
            
            if (isOtherMonth) {
                dayDiv.classList.add('other-month');
            }
            
            const today = KoreanTime.now();
            if (KoreanTime.isSameDay(date, today)) {
                dayDiv.classList.add('today');
            }
            
            if (KoreanTime.isSameDay(date, selectedDate)) {
                dayDiv.classList.add('selected');
            }

            // Check if it's a weekend
            const dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayDiv.classList.add('weekend');
            }

            // Check if it's a holiday
            const year = date.getFullYear();
            const monthDay = KoreanTime.formatDate(date).substring(5); // MM-DD
            if (holidays[year] && holidays[year][monthDay]) {
                dayDiv.classList.add('holiday');
                dayDiv.title = holidays[year][monthDay]; // Add holiday name as tooltip
            }
            
            const dayNumber = DomUtils.createElement('div', 'day-number', date.getDate());
            dayDiv.appendChild(dayNumber);

            if (dayDiv.classList.contains('holiday')) {
                const holidayName = DomUtils.createElement('div', 'holiday-name', holidays[year][monthDay]);
                dayDiv.appendChild(holidayName);
            }
            
            const dayTasks = this.getTasksForDate(date, tasks);
            if (dayTasks.length > 0) {
                const tasksDiv = DomUtils.createElement('div', 'day-tasks');
                
                const displayTasks = dayTasks.slice(0, 3);
                displayTasks.forEach(task => {
                    const taskDot = DomUtils.createElement('span', `task-dot status-${task.status}`);
                    taskDot.title = task.taskName;
                    tasksDiv.appendChild(taskDot);
                });
                
                if (dayTasks.length > 3) {
                    const moreText = document.createTextNode(` +${dayTasks.length - 3}`);
                    tasksDiv.appendChild(moreText);
                }
                
                dayDiv.appendChild(tasksDiv);
            }
            
            dayDiv.addEventListener('click', () => {
                window.selectDate(new Date(date));
            });
            
            return dayDiv;
        },
        
        getTasksForDate: function(date, tasks) {
            return tasks.filter(task => {
                // Only mark tasks on their end date, if an end date exists
                return task.endDate && KoreanTime.isSameDay(date, task.endDate);
            });
        }
    },
    
    // 업무 카드 렌더링
    task: {
        createCard: function(task) {
            const taskDiv = DomUtils.createElement('div', `task-item status-${task.status}`);
            
            // 헤더
            const header = DomUtils.createElement('div', 'task-header');
            const title = DomUtils.createElement('div', 'task-title', task.taskName);
            const status = DomUtils.createElement('span', `task-status status-${task.status}`, task.status);
            const priorityText = {
                'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
            }[task.priority] || '중간';
            const priority = DomUtils.createElement('span', `task-priority priority-${task.priority}`, priorityText);
            header.appendChild(title);
            header.appendChild(status);
            header.appendChild(priority);
            
            // 카테고리
            const category = DomUtils.createElement('div', 'task-category');
            let categoryText = task.category1;
            if (task.category2) categoryText += ` > ${task.category2}`;
            if (task.category3) categoryText += ` > ${task.category3}`;
            category.textContent = categoryText;
            
            // 설명
            const description = DomUtils.createElement('div', 'task-description', task.description || '설명 없음');
            
            taskDiv.appendChild(header);
            taskDiv.appendChild(category);
            taskDiv.appendChild(description);
            
            // 액션 버튼
            const actions = DomUtils.createElement('div', 'task-actions');
            
            const memoBtn = DomUtils.createElement('button', 'btn-memo', '메모');
            memoBtn.onclick = (e) => {
                e.stopPropagation();
                window.openImportantMemoModal(task.id, task.importantMemo);
            };
            
            const editBtn = DomUtils.createElement('button', 'btn-edit', '수정');
            editBtn.onclick = (e) => {
                e.stopPropagation();
                window.openTaskModal(task);
            };
            
            const copyBtn = DomUtils.createElement('button', 'btn-copy', '복사');
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                window.copyTask(task);
            };
            
            const deleteBtn = DomUtils.createElement('button', 'btn-delete', '삭제');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                window.deleteTask(task.id);
            };
            
            actions.appendChild(memoBtn); // Added this line
            actions.appendChild(editBtn);
            actions.appendChild(copyBtn);
            actions.appendChild(deleteBtn);
            
            taskDiv.appendChild(actions);
            
            return taskDiv;
        },

        renderStatusSummary: function(tasks, targetElementId) {
            const targetElement = document.getElementById(targetElementId);
            if (!targetElement) return;

            const statusCounts = {
                '전체': tasks.length,
                '대기': 0,
                '진행중': 0,
                '완료': 0,
                '보류': 0
            };

            tasks.forEach(task => {
                if (statusCounts.hasOwnProperty(task.status)) {
                    statusCounts[task.status]++;
                }
            });

            let summaryHtml = '<div class="status-summary-item-wrapper">';
            Object.keys(statusCounts).forEach(status => {
                const count = statusCounts[status];
                const statusClass = `status-${status}`;
                const clickableStatus = status === '전체' ? '' : status; // '전체' status should clear the filter
                summaryHtml += `
                    <div class="status-summary-item" onclick="window.openAllTasksModalWithStatus('${clickableStatus}')">
                        <span class="status-summary-label ${statusClass}">${status}</span>
                        <span class="status-summary-count ${statusClass}">${count}</span>
                    </div>
                `;
            });
            summaryHtml += '</div>';
            targetElement.innerHTML = summaryHtml;
        }
    },
    
    // 카테고리 트리 렌더링
    category: {
        renderTree: function(categories) {
            const treeView = document.getElementById('categoryTreeView');
            
            if (categories.length === 0) {
                treeView.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">등록된 분류가 없습니다.</p>';
                return;
            }
            
            const grouped = {};
            const mainCategories = new Set();
            
            categories.forEach(cat => {
                mainCategories.add(cat.mainCategory);
                
                if (!grouped[cat.mainCategory]) {
                    grouped[cat.mainCategory] = {
                        main: null,
                        subs: {}
                    };
                }
                
                if (cat.subCategory) {
                    if (!grouped[cat.mainCategory].subs[cat.subCategory]) {
                        grouped[cat.mainCategory].subs[cat.subCategory] = {
                            sub: null,
                            details: []
                        };
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
                const itemDiv = this.createTreeItem(mainCat, grouped[mainCat]);
                treeView.appendChild(itemDiv);
            });
        },
        
        createTreeItem: function(mainCat, group) {
            const itemDiv = DomUtils.createElement('div', 'category-tree-item');
            
            // 대분류
            const mainDiv = DomUtils.createElement('div', 'category-main');
            const nameSpan = DomUtils.createElement('span', '', mainCat);
            
            const actions = DomUtils.createElement('div', 'category-actions');
            
            if (group.main) {
                const editBtn = DomUtils.createElement('button', 'btn-cat-edit', '수정');
                editBtn.onclick = () => window.editCategoryItem(group.main);
                
                const copyBtn = DomUtils.createElement('button', 'btn-cat-copy', '복사');
                copyBtn.onclick = () => window.copyCategory(group.main);

                const deleteBtn = DomUtils.createElement('button', 'btn-cat-delete', '삭제');
                deleteBtn.onclick = () => window.deleteCategory(group.main.id);
                
                actions.appendChild(editBtn);
                actions.appendChild(copyBtn);
                actions.appendChild(deleteBtn);
            }
            
            mainDiv.appendChild(nameSpan);
            mainDiv.appendChild(actions);
            itemDiv.appendChild(mainDiv);
            
            // 중분류 및 소분류
            const subKeys = Object.keys(group.subs).sort();
            subKeys.forEach(subKey => {
                const subGroup = group.subs[subKey];
                
                const subDiv = DomUtils.createElement('div', 'category-sub');
                const subNameSpan = DomUtils.createElement('span', '', `└ ${subKey}`);
                
                const subActions = DomUtils.createElement('div', 'category-actions');
                
                if (subGroup.sub) {
                    const subEditBtn = DomUtils.createElement('button', 'btn-cat-edit', '수정');
                    subEditBtn.onclick = () => window.editCategoryItem(subGroup.sub);
                    
                    const subCopyBtn = DomUtils.createElement('button', 'btn-cat-copy', '복사');
                    subCopyBtn.onclick = () => window.copyCategory(subGroup.sub);

                    const subDeleteBtn = DomUtils.createElement('button', 'btn-cat-delete', '삭제');
                    subDeleteBtn.onclick = () => window.deleteCategory(subGroup.sub.id);
                    
                    subActions.appendChild(subEditBtn);
                    subActions.appendChild(subCopyBtn);
                    subActions.appendChild(subDeleteBtn);
                }
                
                subDiv.appendChild(subNameSpan);
                subDiv.appendChild(subActions);
                itemDiv.appendChild(subDiv);
                
                // 소분류
                if (subGroup.details.length > 0) {
                    subGroup.details.sort((a, b) => a.detailCategory.localeCompare(b.detailCategory)).forEach(detailCat => {
                        const detailDiv = DomUtils.createElement('div', 'category-detail');
                        const detailNameSpan = DomUtils.createElement('span', '', `    └ ${detailCat.detailCategory}`);
                        
                        const detailActions = DomUtils.createElement('div', 'category-actions');
                        
                        const detailEditBtn = DomUtils.createElement('button', 'btn-cat-edit', '수정');
                        detailEditBtn.onclick = () => window.editCategoryItem(detailCat);
                        
                        const detailCopyBtn = DomUtils.createElement('button', 'btn-cat-copy', '복사');
                        detailCopyBtn.onclick = () => window.copyCategory(detailCat);

                        const detailDeleteBtn = DomUtils.createElement('button', 'btn-cat-delete', '삭제');
                        detailDeleteBtn.onclick = () => window.deleteCategory(detailCat.id);
                        
                        detailActions.appendChild(detailEditBtn);
                        detailActions.appendChild(detailCopyBtn);
                        detailActions.appendChild(detailDeleteBtn);
                        
                        detailDiv.appendChild(detailNameSpan);
                        detailDiv.appendChild(detailActions);
                        
                        itemDiv.appendChild(detailDiv);
                    });
                }
            });
            
            return itemDiv;
        }
    }
};
