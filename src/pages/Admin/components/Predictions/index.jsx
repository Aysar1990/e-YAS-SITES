import React from 'react'
import { usePredictions } from '../../hooks/usePredictions'
import WeekForecastCard from './WeekForecastCard'
import PhaseCompletionTable from './PhaseCompletionTable'
import './Predictions.css'

const Predictions = () => {
    const { predictions, loading } = usePredictions()

    if (loading) return <div style={{ padding: '20px', color: '#9CA3AF' }}>Analyzing velocity...</div>

    if (!predictions) return null

    return (
        <div className="prediction-container">
            <div className="prediction-header">
                <div className="prediction-title">
                    🤖 AI Completion Forecast <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '400', marginLeft: '10px' }}>(Beta)</span>
                </div>
            </div>

            <WeekForecastCard prediction={predictions} />

            <h4 style={{ color: '#E5E7EB', margin: '20px 0 12px 0' }}>Breakdown by Phase</h4>
            <PhaseCompletionTable predictions={predictions.phasePredictions} />
        </div>
    )
}

export default Predictions
