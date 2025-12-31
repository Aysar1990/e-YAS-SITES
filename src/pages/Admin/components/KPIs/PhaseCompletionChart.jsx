import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

const PhaseCompletionChart = ({ data }) => {
    // Check if data is empty
    const hasData = data?.labels?.length > 0 && data?.datasets?.[0]?.data?.some(v => v > 0)

    if (!hasData) {
        return (
            <div className="chart-wrapper empty-chart">
                <div className="no-data-message">
                    <span className="no-data-icon">🏗️</span>
                    <p>No phase data available</p>
                </div>
            </div>
        )
    }

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                padding: 12,
                titleColor: '#F3F4F6',
                bodyColor: '#D1D5DB'
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(75, 85, 99, 0.1)' },
                ticks: { color: '#9CA3AF' },
                max: 100
            },
            y: {
                grid: { display: false },
                ticks: { color: '#F3F4F6', font: { weight: '600' } }
            }
        }
    }

    return (
        <div className="chart-wrapper">
            <Bar options={options} data={data} />
        </div>
    )
}

export default PhaseCompletionChart
