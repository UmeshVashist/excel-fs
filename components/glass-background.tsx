"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export function GlassBackground({ children }: { children: React.ReactNode }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const glowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    )

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = "fixed"
    renderer.domElement.style.inset = "0"
    renderer.domElement.style.pointerEvents = "none"
    mount.appendChild(renderer.domElement)

    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(32, 32, 14, 0, Math.PI * 2)
    ctx.fill()

    const grad = ctx.createRadialGradient(32, 32, 14, 32, 32, 32)
    grad.addColorStop(0, "rgba(255,255,255,1)")
    grad.addColorStop(1, "transparent")

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(32, 32, 32, 0, Math.PI * 2)
    ctx.fill()

    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter

    function createStars(size: number, count: number, spread: number) {
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      const material = new THREE.PointsMaterial({
        map: texture,
        size,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      return new THREE.Points(geometry, material)
    }

    const bigStars = createStars(20, 1500, 4000)
    const midStars = createStars(12, 3000, 7000)
    const smallStars = createStars(6, 5000, 10000)
    scene.add(bigStars, midStars, smallStars)

    camera.position.z = 2000

    let mouseX = 0
    let mouseY = 0
    let frameId: number

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${event.clientX - 150}px, ${event.clientY - 150}px)`
      }
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const elapsed = Date.now() * 0.001

      camera.position.x = Math.sin(elapsed * 0.2) * 180
      camera.position.y = Math.cos(elapsed * 0.17) * 160
      camera.lookAt(0, 0, 0)

      scene.rotation.y += 0.0002 + mouseX * 0.0015
      scene.rotation.x += mouseY * 0.0015
      ;(bigStars.material as THREE.PointsMaterial).opacity =
        0.85 + Math.sin(Date.now() * 0.002) * 0.15

      renderer.render(scene, camera)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)
    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(frameId)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
      texture.dispose()
      ;[bigStars, midStars, smallStars].forEach((points) => {
        points.geometry.dispose()
        ;(points.material as THREE.Material).dispose()
      })
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_25%),radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.1),_transparent_16%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,23,42,0.72))]" />
      <div ref={mountRef} className="absolute inset-0" />
      <div
        ref={glowRef}
        className="pointer-events-none fixed w-[280px] h-[280px] rounded-full bg-cyan-400/20 blur-3xl opacity-90 transition-transform duration-200"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
