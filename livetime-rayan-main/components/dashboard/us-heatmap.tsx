"use client"

import { MapPin } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function USHeatmap() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const mapRef = useRef<HTMLImageElement>(null)

  const states = [
    { number: "01", name: "New York", count: 100, color: "#a855f7", x: 0.76, y: 0.30 },
    { number: "02", name: "Illinois", count: 100, color: "#c084fc", x: 0.58, y: 0.40 },
    { number: "03", name: "California", count: 200, color: "#38bdf8", x: 0.20, y: 0.52 },
    { number: "04", name: "Texas", count: 100, color: "#ef4444", x: 0.47, y: 0.63 },
  ]

  useEffect(() => {
    const updateDimensions = () => {
      if (mapRef.current) {
        setDimensions({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    // Handle image load
    const img = mapRef.current
    if (img && img.complete) {
      updateDimensions()
    }

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div className="flex gap-6 p-4">
      
      {/* Map*/}
      <div className="relative w-full">
        <img
          ref={mapRef}
          src="/us.svg"
          alt="US Map"
          className="w-full h-auto"
          onLoad={() => {
            if (mapRef.current) {
              setDimensions({
                width: mapRef.current.offsetWidth,
                height: mapRef.current.offsetHeight
              })
            }
          }}
        />

        {/* Map pins overlay */}
        {dimensions.width > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {states.map((state) => (
              <div
                key={state.number}
                className="absolute"
                style={{ 
                  left: `${state.x * dimensions.width}px`, 
                  top: `${state.y * dimensions.height}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="relative flex items-center justify-center">
                  <MapPin
                    size={48}
                    fill={state.color}
                    stroke="white"
                    strokeWidth={2.5}
                    className="drop-shadow-lg"
                  />
                  <div 
                    className="absolute top-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: state.color }}
                  >
                    {state.number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend Section */}
      <div className="w-48 space-y-4 flex-shrink-0">
        {states.map((state) => (
          <div key={state.number} className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: state.color }}
            >
              {state.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{state.name}</div>
              <div className="text-xs text-gray-500">{state.count} individuals reached</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}