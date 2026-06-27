"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ModalBackdrop — a live Three.js scene rendered behind the premium prototype.
 *
 * Two layers create the "insane" depth:
 *   1. A drifting golden particle field (~900 points) with subtle mouse
 *      parallax — reads as a starlit night sky over a mosque.
 *   2. A slowly rotating wireframe icosahedron (an 8-pointed-star feel) glowing
 *      in gold + emerald, the geometric heart of Islamic art.
 *
 * Everything WebGL-touching lives inside the effect so it never runs on the
 * server. Cleans up the renderer + geometries on unmount to avoid leaks.
 */
export default function ModalBackdrop() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070f, 0.05);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ---- Layer 1: golden particle field -------------------------------
    const COUNT = 900;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xe6bd55,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ---- Layer 2: glowing wireframe geometric star --------------------
    const icoGeo = new THREE.IcosahedronGeometry(6, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0xe6bd55,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    const icoGeo2 = new THREE.IcosahedronGeometry(3.4, 0);
    const icoMat2 = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const ico2 = new THREE.Mesh(icoGeo2, icoMat2);
    scene.add(ico2);

    // ---- Interaction + animation --------------------------------------
    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    let raf;
    let t = 0;
    const animate = () => {
      t += 0.005;
      points.rotation.y = t * 0.4;
      points.rotation.x = Math.sin(t * 0.3) * 0.1;
      ico.rotation.y = t * 0.6;
      ico.rotation.x = t * 0.3;
      ico2.rotation.y = -t * 0.9;
      ico2.rotation.z = t * 0.5;

      // gentle parallax toward the cursor
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 1.4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      pGeo.dispose();
      pMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      icoGeo2.dispose();
      icoMat2.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
