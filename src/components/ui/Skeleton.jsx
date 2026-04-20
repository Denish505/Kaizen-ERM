export function Skeleton({ className = '', variant = 'text' }) {
    const variants = {
        text: 'skeleton skeleton-text',
        title: 'skeleton skeleton-title',
        avatar: 'skeleton skeleton-avatar',
        card: 'skeleton skeleton-card',
    }

    return <div className={`${variants[variant]} ${className}`} />
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {Array(cols).fill(0).map((_, i) => (
                            <th key={i}><Skeleton variant="text" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array(rows).fill(0).map((_, i) => (
                        <tr key={i}>
                            {Array(cols).fill(0).map((_, j) => (
                                <td key={j}><Skeleton variant="text" /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function SkeletonCard({ count = 4 }) {
    return (
        <div className="grid grid-4">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="stat-card">
                    <Skeleton variant="avatar" className="mb-3" />
                    <Skeleton variant="title" />
                    <Skeleton variant="text" style={{ width: '40%' }} />
                </div>
            ))}
        </div>
    )
}

export default Skeleton
