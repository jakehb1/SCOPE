import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Markets from '@/components/Markets';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      <Features />
      <Markets />
      <Footer />
    </main>
  );
}

