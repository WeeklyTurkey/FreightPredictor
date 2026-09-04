export default function TrustBadge({ score, size = 'md' }) {
  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (score >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Trusted';
    if (score >= 50) return 'Moderate';
    return 'High Risk';
  };

  const colors = getScoreColor(score);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} ${colors.bg} ${colors.text} border ${colors.border} rounded-full font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {score} · {getLabel(score)}
    </span>
  );
}
