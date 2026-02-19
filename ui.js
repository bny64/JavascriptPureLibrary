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
            // Calculate total days rendered so far (excluding weekday headers)
            const daysRenderedSoFar = calendar.children.length - weekdays.length; // calendar.children.length includes weekday headers
            
            // We want to limit to a maximum of 5 rows of days (5 * 7 = 35 days)
            const maxDaysInGrid = 35; 
            
            let daysToRenderFromNextMonth = 0;
            if (daysRenderedSoFar < maxDaysInGrid) {
                daysToRenderFromNextMonth = maxDaysInGrid - daysRenderedSoFar;
            }
            
            for (let day = 1; day <= daysToRenderFromNextMonth; day++) {
                const date = new Date(year, month + 1, day);
                const dayDiv = this.createDayElement(
                    date,
                    true, // isOtherMonth
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

            if (task.importantMemo && task.importantMemo.trim() !== '') {
                const memoIcon = DomUtils.createElement('span', 'task-memo-icon', '📌');
                memoIcon.title = '중요 메모 있음';
                memoIcon.onclick = (e) => {
                    e.stopPropagation(); // 카드 클릭 이벤트와 중복 방지
                    window.openImportantMemoModal(task.id, task.importantMemo);
                };
                header.appendChild(memoIcon);
            }
            
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
                const clickableStatus = status; // Pass '전체' literally
                summaryHtml += `
                    <div class="status-summary-item" data-status="${status}" onclick="window.openAllTasksModalWithStatus('${clickableStatus}')">
                        <span class="status-summary-label ${statusClass}">${status}</span>
                        <span class="status-summary-count ${statusClass}">${count}</span>
                    </div>
                `;
            });
            summaryHtml += '</div>';
            targetElement.innerHTML = summaryHtml;
        },

        renderPrioritySummary: function(tasks, targetElementId) {
            const targetElement = document.getElementById(targetElementId);
            if (!targetElement) return;

            const unfinishedTasks = tasks.filter(task => task.status !== '완료'); // Filter out completed tasks

            const priorityLabels = {
                'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
            };
            const priorityOrder = ['very-high', 'high', 'middle', 'low', 'very-low'];
            
            const priorityCounts = {
                '전체': unfinishedTasks.length, // Count from unfinished tasks
                'very-high': 0,
                'high': 0,
                'middle': 0,
                'low': 0,
                'very-low': 0
            };

            unfinishedTasks.forEach(task => { // Iterate over unfinished tasks
                const priority = task.priority || 'middle'; // Default to middle if not set
                if (priorityCounts.hasOwnProperty(priority)) {
                    priorityCounts[priority]++;
                }
            });

            let summaryHtml = '<div class="priority-summary-item-wrapper">';
            summaryHtml += `
                <div class="priority-summary-item" data-priority="전체" onclick="window.openAllTasksModalWithPriority('전체')">
                    <span class="priority-summary-label">전체</span>
                    <span class="priority-summary-count">${unfinishedTasks.length}</span>
                </div>
            `;
            priorityOrder.forEach(priorityKey => {
                const count = priorityCounts[priorityKey];
                const priorityClass = `priority-${priorityKey}`;
                summaryHtml += `
                    <div class="priority-summary-item" data-priority="${priorityKey}" onclick="window.openAllTasksModalWithPriority('${priorityKey}')">
                        <span class="priority-summary-label ${priorityClass}">${priorityLabels[priorityKey]}</span>
                        <span class="priority-summary-count ${priorityClass}">${count}</span>
                    </div>
                `;
            });
            summaryHtml += '</div>';
            targetElement.innerHTML = summaryHtml;
        },

        renderUnfinishedTasksSummary: function(tasks) {
            const unfinishedTaskCountElement = document.getElementById('unfinishedTaskCount');
            if (!unfinishedTaskCountElement) return;

            const unfinishedTasks = tasks.filter(task => task.status !== '완료');
            unfinishedTaskCountElement.textContent = unfinishedTasks.length;
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
    },
    
    // 대시보드 렌더링
    dashboard: {
        render: function(tasks) {
            this.renderSummary(tasks);
            this.renderStatusChart(tasks);
            this.renderPriorityChart(tasks);
            this.renderCategoryProgress(tasks);
        },

        renderSummary: function(tasks) {
            const container = document.getElementById('dashboardSummary');
            if (!container) return;

            const total = tasks.length;
            const completed = tasks.filter(t => t.status === '완료').length;
            const inProgress = tasks.filter(t => t.status === '진행중').length;
            const pending = tasks.filter(t => t.status === '대기').length;
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

            const stats = [
                { label: '전체 업무', value: total, icon: '📋' },
                { label: '대기 업무', value: pending, icon: '🟡' },
                { label: '진행 중', value: inProgress, icon: '🔵' },
                { label: '완료 업무', value: completed, icon: '✅' },
                { label: '전체 진행률', value: `${progressPercent}%`, icon: '📈' }
            ];

            container.innerHTML = stats.map(stat => `
                <div class="summary-card">
                    <div class="icon">${stat.icon}</div>
                    <div class="value">${stat.value}</div>
                    <div class="label">${stat.label}</div>
                </div>
            `).join('');
        },

        renderStatusChart: function(tasks) {
            const container = document.getElementById('statusChart');
            if (!container) return;

            const counts = {
                '대기': tasks.filter(t => t.status === '대기').length,
                '진행중': tasks.filter(t => t.status === '진행중').length,
                '완료': tasks.filter(t => t.status === '완료').length,
                '보류': tasks.filter(t => t.status === '보류').length
            };

            const colors = {
                '대기': '#ffc107',
                '진행중': '#2196f3',
                '완료': '#4caf50',
                '보류': '#9e9e9e'
            };

            this.renderBarChart(container, counts, colors, tasks.length);
        },

        renderPriorityChart: function(tasks) {
            const container = document.getElementById('priorityChart');
            if (!container) return;

            const labels = {
                'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
            };
            
            const counts = {
                'very-high': tasks.filter(t => t.priority === 'very-high').length,
                'high': tasks.filter(t => t.priority === 'high').length,
                'middle': tasks.filter(t => (t.priority === 'middle' || !t.priority)).length,
                'low': tasks.filter(t => t.priority === 'low').length,
                'very-low': tasks.filter(t => t.priority === 'very-low').length
            };

            const colors = {
                'very-high': '#e53935', 'high': '#fb8c00', 'middle': '#3f51b5', 'low': '#4caf50', 'very-low': '#607d8b'
            };

            const namedCounts = {};
            Object.keys(counts).forEach(key => namedCounts[labels[key]] = counts[key]);
            
            const namedColors = {};
            Object.keys(colors).forEach(key => namedColors[labels[key]] = colors[key]);

            this.renderBarChart(container, namedCounts, namedColors, tasks.length);
        },

        renderBarChart: function(container, counts, colors, total) {
            container.innerHTML = Object.keys(counts).map(label => {
                const count = counts[label];
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return `
                    <div class="chart-bar-item">
                        <div class="chart-bar-label">${label}</div>
                        <div class="chart-bar-wrapper">
                            <div class="chart-bar-fill" style="width: ${percent}%; background-color: ${colors[label] || '#ddd'}"></div>
                        </div>
                        <div class="chart-bar-value">${count}</div>
                    </div>
                `;
            }).join('');
        },

        renderCategoryProgress: function(tasks) {
            const container = document.getElementById('categoryProgressList');
            if (!container) return;

            const catStats = {};
            tasks.forEach(task => {
                const cat = task.category1 || '미분류';
                if (!catStats[cat]) catStats[cat] = { total: 0, completed: 0 };
                catStats[cat].total++;
                if (task.status === '완료') catStats[cat].completed++;
            });

            const sortedCats = Object.keys(catStats).sort();
            
            container.innerHTML = sortedCats.map(cat => {
                const stats = catStats[cat];
                const percent = Math.round((stats.completed / stats.total) * 100);
                return `
                    <div class="cat-progress-item">
                        <div class="cat-progress-header">
                            <span class="cat-name">${cat}</span>
                            <span class="cat-percent">${percent}% (${stats.completed}/${stats.total})</span>
                        </div>
                        <div class="chart-bar-wrapper">
                            <div class="chart-bar-fill" style="width: ${percent}%; background-color: #11998e"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },
    
    // 칸반 보드 렌더링
    kanban: {
        render: function(tasks) {
            const statuses = ['대기', '진행중', '완료', '보류'];
            
            statuses.forEach(status => {
                const columnContainer = document.getElementById(`kanban-${status}`);
                const countElement = document.querySelector(`.kanban-column-header.status-${status} .count`);
                const searchTerm = AppState.kanbanSearchTerms[status] || '';
                
                if (!columnContainer) return;
                
                let filteredTasks = tasks.filter(t => t.status === status);

                if (searchTerm) {
                    const lowerCaseSearchTerm = searchTerm.toLowerCase();
                    filteredTasks = filteredTasks.filter(task =>
                        task.taskName.toLowerCase().includes(lowerCaseSearchTerm) ||
                        (task.description && task.description.toLowerCase().includes(lowerCaseSearchTerm))
                    );
                }

                countElement.textContent = filteredTasks.length;
                
                columnContainer.innerHTML = '';
                filteredTasks.forEach(task => {
                    columnContainer.appendChild(this.createCard(task));
                });
            });
        },

        createCard: function(task) {
            const card = DomUtils.createElement('div', 'kanban-card');
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-id', task.id);
            
            // 드래그 이벤트 리스너 추가
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
            });

            const priorityText = {
                'very-high': '매우 높음', 'high': '높음', 'middle': '중간', 'low': '낮음', 'very-low': '매우 낮음'
            }[task.priority] || '중간';

            const priorityClass = `priority-${task.priority || 'middle'}`;
            card.style.borderLeftColor = this.getPriorityColor(task.priority);

            card.innerHTML = `
                <div class="kanban-card-title">${TextUtils.escapeHtml(task.taskName)}</div>
                <div class="task-category" style="margin-bottom: 8px;">${TextUtils.escapeHtml(task.category1 || '미분류')}</div>
                <div class="kanban-card-meta">
                    <span class="task-priority ${priorityClass}">${priorityText}</span>
                    <span class="task-date">${task.endDate || ''}</span>
                </div>
            `;

            card.addEventListener('click', () => window.openTaskModal(task));
            
            return card;
        },

        getPriorityColor: function(priority) {
            const colors = {
                'very-high': '#e53935', 'high': '#fb8c00', 'middle': '#3f51b5', 'low': '#4caf50', 'very-low': '#607d8b'
            };
            return colors[priority] || '#3f51b5';
        }
    }
};
