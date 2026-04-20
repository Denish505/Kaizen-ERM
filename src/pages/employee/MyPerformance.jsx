import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Star, TrendingUp, Award, Target, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { SkeletonCard } from '../../components/ui'
import api from '../../services/api'

function RatingBar({ value = 0, max = 5 }) {
    const pct = (value / max) * 100
    const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)'
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color, minWidth: '2rem', textAlign: 'right' }}>{value}/{max}</span>
        </div>
    )
}

function StarRating({ value = 0, max = 5 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: max }).map((_, i) => (
                <Star key={i} size={16} style={{ color: i < value ? 'var(--warning)' : 'var(--border-color)', fill: i < value ? 'var(--warning)' : 'none' }} />
            ))}
        </div>
    )
}

export default function MyPerformance() {
    const { user } = useAuth()
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await api.get('/hrm/performance-reviews/')
            // Normalize backend fields to what UI expects
            const normalized = res.data.map(r => ({
                ...r,
                overall_rating: r.overall_rating ?? r.rating ?? 0,
                feedback: r.feedback ?? r.comments ?? '',
                goals: typeof r.goals === 'string' && r.goals
                    ? r.goals.split('\n').filter(Boolean)
                    : (Array.isArray(r.goals) ? r.goals : []),
            }))
            setReviews(normalized)
        } catch (err) {
            console.error('Failed to fetch performance reviews', err)
        } finally {
            setLoading(false)
        }
    }

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + parseFloat(r.overall_rating || 0), 0) / reviews.length).toFixed(1)
        : '—'

    const latestReview = reviews[0]

    const getPeriodLabel = (r) => {
        if (r.review_period_start && r.review_period_end) {
            return `${r.review_period_start} → ${r.review_period_end}`
        }
        return r.period || r.review_type || 'Performance Review'
    }

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'var(--success)'
        if (rating >= 3) return 'var(--warning)'
        return 'var(--error)'
    }

    if (loading) return <div className="animate-fadeIn"><SkeletonCard count={3} /></div>

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Performance</h1>
                    <p className="page-subtitle">Reviews, ratings & feedback</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="dashboard-stats-grid" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Overall Average', value: avgRating, icon: <Star size={20} />, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                    { label: 'Reviews Done', value: reviews.length, icon: <Award size={20} />, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.15)' },
                    { label: 'Latest Rating', value: latestReview?.overall_rating ? `${latestReview.overall_rating}/5` : '—', icon: <TrendingUp size={20} />, color: latestReview ? getRatingColor(latestReview.overall_rating) : 'var(--text-muted)', bg: 'var(--bg-card)' },
                    { label: 'Goals Set', value: latestReview?.goals?.length || 0, icon: <Target size={20} />, color: 'var(--success)', bg: 'var(--success-bg)' },
                ].map(s => (
                    <div key={s.label} className="dashboard-stat-card hover-lift">
                        <div className="stat-card-header">
                            <div className="stat-card-icon-wrapper" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        </div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Latest review highlight */}
            {latestReview && (
                <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.75rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(99,102,241,0.04))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.25rem' }}>
                                Latest Review
                            </p>
                            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{getPeriodLabel(latestReview)}</h3>
                            {latestReview.reviewer_name && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Reviewed by {latestReview.reviewer_name}</p>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getRatingColor(latestReview.overall_rating), lineHeight: 1 }}>
                                {latestReview.overall_rating}
                            </div>
                            <StarRating value={Math.round(latestReview.overall_rating)} />
                            <div className="stat-card-label" style={{ marginTop: '0.25rem' }}>Overall</div>
                        </div>
                    </div>

                    {/* Category ratings */}
                    {latestReview.criteria && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', marginBottom: '1rem' }}>
                            {Object.entries(latestReview.criteria).map(([key, val]) => (
                                <div key={key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <RatingBar value={val} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Feedback */}
                    {latestReview.feedback && (
                        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-500)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                                <MessageSquare size={14} /> MANAGER FEEDBACK
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7 }}>"{latestReview.feedback}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Review History */}
            {reviews.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Award size={48} style={{ opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No performance reviews yet</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.3rem' }}>Your manager will add reviews here.</p>
                </div>
            ) : (
                <div className="glass-card">
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Review History</div>
                    {reviews.map(r => (
                        <div key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div
                                style={{ padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getPeriodLabel(r)}</div>
                                    {r.reviewer_name && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>By {r.reviewer_name}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 700, color: getRatingColor(r.overall_rating) }}>{r.overall_rating}/5</span>
                                        <StarRating value={Math.round(r.overall_rating)} />
                                    </div>
                                    {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>
                            {expandedId === r.id && (
                                <div style={{ padding: '1rem 1.5rem 1.25rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                                    {r.feedback && (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.7 }}>"{r.feedback}"</p>
                                    )}
                                    {r.goals && r.goals.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>GOALS</p>
                                            {r.goals.map((g, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                    <Target size={12} style={{ color: 'var(--primary-400)' }} /> {g}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
