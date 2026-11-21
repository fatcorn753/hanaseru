import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, getProfile } from "./lib/db";
import { NavContext, type Route } from "./lib/nav";
import { Dojo } from "./screens/Dojo";
import { ExperimentFlow } from "./screens/ExperimentFlow";
import { Foundation } from "./screens/Foundation";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Pep } from "./screens/Pep";
import { Records } from "./screens/Records";
import { Settings } from "./screens/Settings";
import { Talk } from "./screens/Talk";
import { VideoReviewScreen } from "./screens/VideoReview";
import { WeeklyReview } from "./screens/WeeklyReview";

const TABS: { name: Route["name"]; label: string; ico: string }[] = [
  { name: "home", label: "ホーム", ico: "⌂" },
  { name: "experiment", label: "実験", ico: "◎" },
  { name: "dojo", label: "道場", ico: "◇" },
  { name: "foundation", label: "整える", ico: "○" },
  { name: "records", label: "記録", ico: "▤" },
];

export function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const profile = useLiveQuery(() => getProfile(), []);
  const go = (r: Route) => {
    setRoute(r);
    window.scrollTo(0, 0);
  };

  // ブラウザの「戻る」でアプリが閉じないよう、画面遷移を履歴に積む
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setRoute((e.state as Route) ?? { name: "home" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (JSON.stringify(history.state) !== JSON.stringify(route)) history.pushState(route, "");
  }, [route]);

  if (!profile) return null;
  if (!profile.onboardedAt) return <Onboarding profile={profile} />;

  let screen;
  switch (route.name) {
    case "home": screen = <Home />; break;
    case "experiment": screen = <ExperimentFlow key={JSON.stringify(route)} resumeId={route.resumeId} missionId={route.missionId} />; break;
    case "dojo": screen = <Dojo drillId={route.drillId} />; break;
    case "foundation": screen = <Foundation tool={route.tool} />; break;
    case "video": screen = <VideoReviewScreen />; break;
    case "records": screen = <Records />; break;
    case "settings": screen = <Settings />; break;
    case "pep": screen = <Pep experimentId={route.experimentId} />; break;
    case "review": screen = <WeeklyReview weekStart={route.weekStart} />; break;
    case "talk": screen = <Talk scriptId={route.scriptId} />; break;
  }

  return (
    <NavContext.Provider value={go}>
      <main>{screen}</main>
      <nav className="tabs" aria-label="メイン">
        <div className="inner">
          {TABS.map((t) => (
            <button key={t.name} aria-current={route.name === t.name || (route.name === "talk" && t.name === "dojo") ? "page" : undefined} onClick={() => go({ name: t.name } as Route)}>
              <span className="ico" aria-hidden>{t.ico}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </NavContext.Provider>
  );
}

// テスト時に DB を参照できるよう公開(本番の挙動には影響しない)
if (import.meta.env.DEV) (window as unknown as { db: typeof db }).db = db;
