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

const AgingDistributionChart = ({ distribution }) => {
    const options = {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                padding: 12,
                titleColor: '#F3F4F6',
                bodyColor: '#D1D5DB',
                borderColor: '#374151',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(75, 85, 99, 0.2)',
                },
                ticks: {
                    color: '#9CA3AF',
                },
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#F3F4F6',
                    font: {
                        weight: '600',
                    },
                },
            },
        },
    }

    const data = {
        labels: distribution.map(d => d.label),
        datasets: [
            {
                data: distribution.map(d => d.count),
                backgroundColor: distribution.map(d => d.color),
                borderRadius: 4,
                barThickness: 20,
            },
        ],
    }

    return (
        <div className="chart-container">
            <Bar options={options} data={data} />
        </div>
    )
}

export default AgingDistributionChart
