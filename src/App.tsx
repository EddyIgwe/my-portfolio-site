import { useEffect } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Availability } from './components/Availability';
import { About } from './components/About';
import { Work } from './components/Work';
import { Experience } from './components/Experience';
import { Rates } from './components/Rates';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { useRevealObserver } from './lib/hooks';

declare global {
  interface Window {
    __ready?: boolean;
  }
}

export default function App() {
  useRevealObserver();
  useEffect(() => {
    window.__ready = true;
  }, []);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Availability />
        <About />
        <Work />
        <Experience />
        <Rates />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
