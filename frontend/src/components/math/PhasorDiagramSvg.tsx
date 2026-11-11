import React from "react"

interface PhasorDiagramSvgProps {
  vr?: number // default 40
  vl?: number // default 60
  vc?: number // default 30
  vNet?: number // default 50
  className?: string
}

export const PhasorDiagramSvg: React.FC<PhasorDiagramSvgProps> = ({
  vr = 40,
  vl = 60,
  vc = 30,
  vNet = 50,
  className = "",
}) => {
  const vReactance = vl - vc // 30
  // SVG coordinates: origin at (50, 150)
  // Scale factor: 3.5px per Volt
  const originX = 50
  const originY = 150
  const scale = 3.2

  const vrWidth = vr * scale // 128px
  const vReactanceHeight = vReactance * scale // 96px

  const endX = originX + vrWidth // 178
  const endY = originY - vReactanceHeight // 54

  return (
    <div className={`p-3 rounded-xl bg-[#080D19]/90 border border-[#8EB5FF]/20 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-mono text-[#AAB6CC] pb-2 border-b border-[#8EB5FF]/10 mb-2">
        <span className="text-[#58D6E8] font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#58D6E8] animate-pulse" />
          <span>Vector Phasor Geometry (Complex Plane)</span>
        </span>
        <span className="text-[10px] text-[#AAB6CC]">
          V_net = V_R + j(V_L - V_C)
        </span>
      </div>

      <svg
        viewBox="0 0 280 180"
        className="w-full h-auto overflow-visible select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="arrow-cyan"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#58D6E8" />
          </marker>
          <marker
            id="arrow-ice"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#8EB5FF" />
          </marker>
          <marker
            id="arrow-electric"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#527CFF" />
          </marker>
        </defs>

        {/* Subtle Coordinate Grid Lines */}
        <line x1="20" y1={originY} x2="260" y2={originY} stroke="rgba(142, 181, 255, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={originX} y1="20" x2={originX} y2="170" stroke="rgba(142, 181, 255, 0.15)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Axis Labels */}
        <text x="250" y={originY - 8} fill="#AAB6CC" fontSize="10" fontFamily="IBM Plex Mono">Real</text>
        <text x={originX + 6} y="30" fill="#AAB6CC" fontSize="10" fontFamily="IBM Plex Mono">+j Im</text>

        {/* Vector 1: V_R along Real Axis */}
        <line
          x1={originX}
          y1={originY}
          x2={originX + vrWidth - 4}
          y2={originY}
          stroke="#8EB5FF"
          strokeWidth="2.5"
          markerEnd="url(#arrow-ice)"
        />
        <text
          x={originX + vrWidth / 2 - 14}
          y={originY + 16}
          fill="#8EB5FF"
          fontSize="10"
          fontFamily="IBM Plex Mono"
          fontWeight="bold"
        >
          V_R = 40 V
        </text>

        {/* Vector 2: V_L - V_C along Imaginary Axis */}
        <line
          x1={originX + vrWidth}
          y1={originY}
          x2={originX + vrWidth}
          y2={endY + 4}
          stroke="#58D6E8"
          strokeWidth="2.5"
          markerEnd="url(#arrow-cyan)"
        />
        <text
          x={originX + vrWidth + 8}
          y={originY - vReactanceHeight / 2}
          fill="#58D6E8"
          fontSize="10"
          fontFamily="IBM Plex Mono"
          fontWeight="bold"
        >
          V_L - V_C = 30 V
        </text>

        {/* Dashed projections */}
        <line
          x1={originX}
          y1={endY}
          x2={originX + vrWidth}
          y2={endY}
          stroke="rgba(88, 214, 232, 0.3)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Resultant Vector: V_net (Hypotenuse) */}
        <line
          x1={originX}
          y1={originY}
          x2={endX - 3}
          y2={endY + 2}
          stroke="#527CFF"
          strokeWidth="3"
          markerEnd="url(#arrow-electric)"
        />

        {/* Pulsing focal point at end */}
        <circle cx={endX} cy={endY} r="4" fill="#527CFF" />
        <circle cx={endX} cy={endY} r="8" fill="rgba(82, 124, 255, 0.3)" />

        {/* Resultant Hypotenuse Label */}
        <text
          x={originX + vrWidth / 2 - 38}
          y={originY - vReactanceHeight / 2 - 10}
          fill="#F4F6FC"
          fontSize="11"
          fontFamily="IBM Plex Mono"
          fontWeight="bold"
        >
          V_net = 50 V
        </text>

        {/* Phase Angle Arc */}
        <path
          d={`M ${originX + 28} ${originY} A 28 28 0 0 0 ${originX + 22} ${originY - 17}`}
          fill="none"
          stroke="#58D6E8"
          strokeWidth="1.5"
        />
        <text
          x={originX + 34}
          y={originY - 6}
          fill="#58D6E8"
          fontSize="9"
          fontFamily="IBM Plex Mono"
        >
          φ = 36.9°
        </text>
      </svg>
    </div>
  )
}
