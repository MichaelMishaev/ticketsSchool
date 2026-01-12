'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'

const heroImages = [
  {
    src: '/restaurants/hero-1.jpg',
    alt: 'מסעדה יוקרתית עם תאורה חמה ושולחנות אלגנטיים'
  },
  {
    src: '/restaurants/hero-2.jpg',
    alt: 'צלחת גורמה מעוצבת'
  },
  {
    src: '/restaurants/hero-3.jpg',
    alt: 'בר מסעדה מודרני'
  },
  {
    src: '/restaurants/hero-4.jpg',
    alt: 'מרפסת מסעדה רומנטית'
  }
]

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: 'rtl' },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  )

  return (
    <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container h-full flex" dir="ltr">
          {heroImages.map((image, index) => (
            <div key={index} className="embla__slide relative flex-[0_0_100%] min-w-0">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          גלו את המסעדות הטובות ביותר
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl drop-shadow-md">
          הזמינו שולחן בקלות במסעדות המובילות בישראל
        </p>
      </div>

      {/* Carousel Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`עבור לשקופית ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
