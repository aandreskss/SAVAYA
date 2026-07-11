'use client'

import { useState, useEffect } from 'react'

const FRASES = [
  { texto: "Barriga llena, corazón contento.", firma: "— Abuela venezolana" },
  { texto: "El que no llora, no mama.", firma: "— Dicho de la abuela" },
  { texto: "Dios aprieta, pero no ahoga.", firma: "— Sabiduría criolla" },
  { texto: "Con paciencia y calma, hasta un burro sube a una palma.", firma: "— Abuela venezolana" },
  { texto: "Camarón que se duerme, se lo lleva la corriente, mi amor.", firma: "— Dicho de la abuela" },
  { texto: "El que madruga, Dios lo ayuda, chamo.", firma: "— Abuela venezolana" },
  { texto: "No hay mal que dure cien años, ni cuerpo que lo resista.", firma: "— Sabiduría criolla" },
  { texto: "Aquí el que no corre, vuela, mi vida.", firma: "— Dicho venezolano" },
  { texto: "Lo que no mata, engorda, mijo.", firma: "— Abuela venezolana" },
  { texto: "Del dicho al hecho hay mucho trecho, chico.", firma: "— Dicho de la abuela" },
  { texto: "Más sabe el diablo por viejo que por diablo.", firma: "— Sabiduría criolla" },
  { texto: "A caballo regalado no se le mira el colmillo.", firma: "— Dicho venezolano" },
  { texto: "El que mucho abarca, poco aprieta, mi amor.", firma: "— Abuela venezolana" },
  { texto: "Agua que no has de beber, déjala correr.", firma: "— Dicho de la abuela" },
  { texto: "Cuídate del agua mansa, que la brava ya hace ruido.", firma: "— Sabiduría criolla" },
  { texto: "No dejes para mañana lo que puedes hacer hoy, chama.", firma: "— Abuela venezolana" },
  { texto: "El que tiene boca, se equivoca — y el que escucha, aprende.", firma: "— Dicho venezolano" },
  { texto: "Todo tiene su tiempo y su momento, mi cielo.", firma: "— Abuela venezolana" },
  { texto: "El que no arriesga, no gana, mijo.", firma: "— Dicho de la abuela" },
  { texto: "En boca cerrada no entran moscas, chico.", firma: "— Sabiduría criolla" },
]

export default function FooterQuote() {
  const [frase, setFrase] = useState<typeof FRASES[0] | null>(null)

  useEffect(() => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)])
  }, [])

  if (!frase) return null

  return (
    <div className="flex flex-col justify-center">
      <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-white/30 mb-3">
        Sabiduría venezolana 🇻🇪
      </p>
      <blockquote className="border-l-2 border-gold/40 pl-3">
        <p className="text-sm text-white/60 italic leading-relaxed">
          &ldquo;{frase.texto}&rdquo;
        </p>
        <p className="text-[11px] text-gold/60 mt-1.5 font-heading">
          {frase.firma}
        </p>
      </blockquote>
    </div>
  )
}
