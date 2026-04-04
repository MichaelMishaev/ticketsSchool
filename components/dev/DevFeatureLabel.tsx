'use client'

interface DevFeatureLabelProps {
  feature: string | string[]
}

export default function DevFeatureLabel({ feature }: DevFeatureLabelProps) {
  if (process.env.NODE_ENV !== 'development') return null

  const features = Array.isArray(feature) ? feature : [feature]

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-1.5 pointer-events-none">
      {features.map((f) => (
        <span
          key={f}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-900/80 text-white text-[11px] font-mono rounded-full border border-white/10 backdrop-blur-sm shadow-lg"
        >
          📁 docs/features/{f}
        </span>
      ))}
    </div>
  )
}
