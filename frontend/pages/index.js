// frontend/pages/index.js
import Hero from '../components/Hero'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
const Demo = dynamic(()=>import('../components/Demo'), { ssr:false })

export default function Home(){
  const demoRef = useRef(null)
  const scrollToDemo = () => demoRef.current?.scrollIntoView({ behavior: 'smooth' })
  return (
    <>
      <Hero onTry={scrollToDemo} onHow={()=>{ document.getElementById('how')?.scrollIntoView({behavior:'smooth'}) }} />
      <div ref={demoRef}><Demo /></div>
    </>
  )
}
