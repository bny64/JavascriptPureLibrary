import html from '../../lib/htmEngine.js';

const { useState, useEffect, useRef } = window.React;

export default function ChartSample() {
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [chartType, setChartType] = useState('bar');

    const getRandomData = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));

    const renderChart = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new window.Chart(ctx, {
            type: chartType,
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
        if (chartInstanceRef.current) {
            chartInstanceRef.current.data.datasets[0].data = getRandomData();
            chartInstanceRef.current.update();
        }
    };

    const toggleChartType = () => {
        setChartType(prevType => (prevType === 'bar' ? 'line' : 'bar'));
    };

    // type이 변경될 때마다 차트 재렌더링
    useEffect(() => {
        renderChart();
        
        return () => {
             if (chartInstanceRef.current) {
                 chartInstanceRef.current.destroy();
             }
        };
    }, [chartType]);

    return html`
        <div className="page-wrap" style=${{ maxWidth: '100%' }}>
            <div className="header" style=${{ marginBottom: '24px' }}>
                <h2 style=${{ fontSize: '20px', color: 'var(--text)' }}>Chart.js 렌더링 테스트 (React)</h2>
                <p style=${{ fontFamily: 'DM Mono', fontSize: '11px', color: 'var(--muted)' }}>Visualization Library Integration</p>
            </div>

            <div style=${{ background: 'var(--surface)', padding: '32px', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '24px' }}>
                <div style=${{ height: '400px', position: 'relative' }}>
                    <canvas ref=${canvasRef}></canvas>
                </div>
            </div>

            <div className="toolbar" style=${{ justifyContent: 'center', gap: '12px' }}>
                <button className="btn btn-primary" onClick=${updateChartData}>데이터 무작위 갱신</button>
                <button className="btn btn-ghost" onClick=${toggleChartType}>차트 타입 변경 (Bar/Line)</button>
            </div>
        </div>
    `;
}
