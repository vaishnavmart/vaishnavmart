'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export const FooterMedallion: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Setup lightweight Three.js scene for slow revolving embossed antique gold seal
    const width = 120
    const height = 120
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 3.5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Antique Gold Medallion Mesh
    const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.18, 48)
    const material = new THREE.MeshStandardMaterial({
      color: 0xc69a5a,
      metalness: 0.85,
      roughness: 0.35,
    })
    const cylinder = new THREE.Mesh(geometry, material)
    cylinder.rotation.x = Math.PI / 2.3
    scene.add(cylinder)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffd79e, 3, 10)
    pointLight.position.set(2, 2, 3)
    scene.add(pointLight)

    const container = mountRef.current
    if (container) {
      container.appendChild(renderer.domElement)
    }

    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      cylinder.rotation.z += 0.005
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center pointer-events-none select-none opacity-90 my-2">
      <div ref={mountRef} className="w-[120px] h-[120px]" />
      <span className="text-[10px] tracking-[0.25em] uppercase text-gold/70 -mt-2 font-medium">
        Satvik Mudra
      </span>
    </div>
  )
}
