import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

const WeeklyTrendChart = ({ data }) => {
    // Check if data is empty
    const hasData = data?.datasets?.some(ds => ds.data?.some(v => v > 0))

    if (!hasData) {
        return (
            <div className="chart-wrapper large empty-chart">
                <div className="no-data-message">
                    <span className="no-data-icon">📊</span>
                    <p>No trend data available</p>
                </div>
            </div>
        )
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#D1D5DB', usePointStyle: true }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(75, 85, 99, 0.1)' },
                ticks: { color: '#9CA3AF' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9CA3AF' }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }

    return (
        <div className="chart-wrapper large">
            <Line options={options} data={data} />
        </div>
    )
}

export default WeeklyTrendChart
