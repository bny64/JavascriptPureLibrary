/* d:\workspace\JavascriptPureLibrary\vue-project\samples\ChartSample.js */
const ChartSample = {
    template: `
        <div class="page-wrap" style="max-width: 100%;">
            <div class="header" style="margin-bottom: 24px;">
                <h2 style="font-size: 20px; color: var(--text);">Chart.js 렌더링 테스트</h2>
                <p style="font-family: 'DM Mono'; font-size: 11px; color: var(--muted);">Visualization Library Integration</p>
            </div>

            <div style="background: var(--surface); padding: 32px; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 24px;">
                <div style="height: 400px; position: relative;">
                    <canvas id="testChart"></canvas>
                </div>
            </div>

            <div class="toolbar" style="justify-content: center; gap: 12px;">
                <button class="btn btn-primary" @click="updateChartData">데이터 무작위 갱신</button>
                <button class="btn btn-ghost" @click="toggleChartType">차트 타입 변경 (Bar/Line)</button>
            </div>
        </div>
    `,
    setup() {
        const { onMounted, ref } = Vue;
        let chartInstance = null;
        const chartType = ref('bar');

        const getRandomData = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));

        const renderChart = () => {
            const ctx = document.getElementById('testChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: chartType.value,
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: '주간 활동량',
                        data: getRandomData(),
                        backgroundColor: 'rgba(91, 106, 255, 0.5)',
                        borderColor: '#5b6aff',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#e8eaf0', font: { family: 'Sora' } } }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#2a2e3d' }, 
                            ticks: { color: '#6b7280' } 
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { color: '#6b7280' } 
                        }
                    }
                }
            });
        };

        const updateChartData = () => {
            if (chartInstance) {
                chartInstance.data.datasets[0].data = getRandomData();
                chartInstance.update();
            }
        };

        const toggleChartType = () => {
            chartType.value = chartType.value === 'bar' ? 'line' : 'bar';
            renderChart();
        };

        onMounted(() => {
            renderChart();
        });

        return {
            updateChartData,
            toggleChartType
        };
    }
};
