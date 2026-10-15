import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// params is URL data: it is read inside <Suspense> so the shared App Shell
// (Partial Prefetching) stays URL-independent and navigation is instant.
export default function JugarPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<JugarSkeleton />}>
      <JugarContent params={params} />
    </Suspense>
  );
}

function JugarSkeleton() {
  return (
    <div className="av-player" aria-busy="true">
      <div className="player-hud">
        <div className="av-skel" style={{ height: 40, width: "50%" }}></div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          <div className="crt-content">
            <span className="spinner"></span>
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">CARGANDO</span>
          <span>CRT-83 · 60 HZ</span>
        </div>
      </div>
    </div>
  );
}

async function JugarContent({ params }: Pick<PageProps<"/juegos/[id]/jugar">, "params">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
