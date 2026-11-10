import React, { useEffect, useRef } from "react"
import * as THREE from "three"

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 24

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Create a refined geometric network (Icosahedron wireframe + point nodes)
    const geometry = new THREE.IcosahedronGeometry(8, 2)

    // Points (nodes)
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.22,
      transparent: true,
      opacity: 0.7,
    })
    const points = new THREE.Points(geometry, pointsMaterial)
    scene.add(points)

    // Wireframe lines
    const wireframeGeometry = new THREE.WireframeGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1d4ed8,
      transparent: true,
      opacity: 0.22,
    })
    const lines = new THREE.LineSegments(wireframeGeometry, lineMaterial)
    scene.add(lines)

    // Inner subtle glow core
    const coreGeometry = new THREE.IcosahedronGeometry(4, 1)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(core)

    // Mouse parallax
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Resize handling
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Smooth mouse easing
      targetX += (mouseX * 0.4 - targetX) * 0.05
      targetY += (mouseY * 0.4 - targetY) * 0.05

      points.rotation.y += 0.0025
      points.rotation.x += 0.0012
      lines.rotation.y += 0.0025
      lines.rotation.x += 0.0012
      core.rotation.y -= 0.003
      core.rotation.x -= 0.0015

      scene.rotation.y = targetX
      scene.rotation.x = -targetY

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      wireframeGeometry.dispose()
      coreGeometry.dispose()
      pointsMaterial.dispose()
      lineMaterial.dispose()
      coreMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none opacity-60 z-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}
