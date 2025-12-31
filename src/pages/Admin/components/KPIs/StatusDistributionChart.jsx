import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const StatusDistributionChart = ({ data }) => {
    // Check if data is empty
    const hasData = data?.datasets?.[0]?.data?.some(v => v > 0)

    if (!hasData) {
        return (
            <div className="chart-wrapper empty-chart">
                <div className="no-data-message">
                    <span className="no-data-icon">📊</span>
                    <p>No status data available</p>
                </div>
            </div>
        )
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#D1D5DB',
                    usePointStyle: true,
                    padding: 20
                }
            }
        },
        elements: {
            acc: {
                borderWidth: 0
            }
        }
    }

    return (
        <div className="chart-wrapper">
            <Doughnut options={options} data={data} />
        </div>
    )
}

export default StatusDistributionChart
