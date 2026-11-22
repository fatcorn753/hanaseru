import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, type ReactNode } from "react";
import { IconChart, IconChat, IconFlask, IconHome, IconWind } from "./components/icons";
import { useFocusHeading } from "./components/ui";
import { requestPersist } from "./lib/backup";
import { db, getProfile } from "./lib/db";
import { NavContext, type Route } from "./lib/nav";
import { Dojo } from "./screens/Dojo";
import { ExperimentFlow } from "./screens/ExperimentFlow";
import { Foundation } from "./screens/Foundation";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Pep } from "./screens/Pep";
import { Records } from "./screens/Records";
import { Rehearsal } from "./screens/Rehearsal";
import { Settings } from "./screens/Settings";
import { Talk } from "./screens/Talk";
import { VideoReviewScreen } from "./screens/VideoReview";
import { WeeklyReview } from "./screens/WeeklyReview";

const TABS: { name: Route["name"]; label: string; ico: ReactNode }[] = [
  { name: "home", label: "ホーム", ico: <IconHome /> },
  { name: "experiment", label: "実験", ico: <IconFlask /> },
  { name: "dojo", label: "道場", ico: <IconChat /> },
  { name: "foundation", label: "整える", ico: <IconWind /> },
  { name: "records", label: "記録", ico: <IconChart /> },
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

  // 初回案内を終えたら、保存データを消さないようブラウザに頼む(結果はブラウザが決める)
  const onboarded = profile?.onboardedAt !== undefined;
  useFocusHeading();
  useEffect(() => {
    if (onboarded) void requestPersist();
  }, [onboarded]);

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
    case "rehearsal": screen = <Rehearsal />; break;
  }

  return (
    <NavContext.Provider value={go}>
      <main>{screen}</main>
      <nav className="tabs" aria-label="メイン">
        <div className="inner">
          {TABS.map((t) => (
            <button key={t.name} type="button" aria-current={route.name === t.name || ((route.name === "talk" || route.name === "rehearsal") && t.name === "dojo") ? "page" : undefined} onClick={() => go({ name: t.name } as Route)}>
              {t.ico}
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
