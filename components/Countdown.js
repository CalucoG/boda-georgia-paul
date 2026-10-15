"use client";

import { useEffect, useState } from "react";

const weddingDate = new Date("2026-10-17T18:00:00-05:00").getTime();

function getTimeLeft() {
  const now = Date.now();
  const distance = weddingDate - now;

  if (distance <= 0) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    ended: false,
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.ended) {
    return <p className="countdownEnded">¡Llegó nuestro gran día! ♡</p>;
  }

  const items = [
    { value: timeLeft.days, label: "Días" },
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Seg" },
  ];

  return (
    <div className="countdown">
      {items.map((item) => (
        <div key={item.label} className="countdownItem">
          <strong>{String(item.value).padStart(2, "0")}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
