import Link from "next/link";

export default function NotFound() {
  return (
    <div className="av-404 fade-in">
      <div className="crt">
        <div className="crt-screen">
          <div className="crt-content">
            <div className="no-signal" aria-hidden="true">404</div>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SIN SEÑAL</span>
          <span>CRT-83</span>
        </div>
      </div>

      <h1>Este juego no está en el vault</h1>
      <p>La dirección no corresponde a ningún juego ni pantalla. Revisa el enlace o elige otro juego en la biblioteca.</p>
      <Link href="/biblioteca" className="btn lg">VOLVER A LA BIBLIOTECA</Link>
    </div>
  );
}
