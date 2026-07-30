"use client";

import { useEffect, useMemo, useState } from "react";

type Brawler = {
  id: number;
  name: string;
  role: string;
  rarity: string;
  image: string;
  color: string;
  power: number;
  control: number;
  survival: number;
  mobility: number;
  description?: string;
  gadgets?: Ability[];
  starPowers?: Ability[];
};

type Ability = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
};

type ApiBrawler = {
  id: number;
  name: string;
  imageUrl2: string;
  description: string;
  class: { name: string };
  rarity: { name: string; color: string };
  gadgets: Ability[];
  starPowers: Ability[];
};

type PlayerProfile = {
  status?: string;
  tag: string;
  name?: string;
  trophies?: number;
  highestTrophies?: number;
  expLevel?: number;
  "3vs3Victories"?: number;
  soloVictories?: number;
  duoVictories?: number;
  club?: { name?: string };
  brawlers?: Array<{ id: number; name: string; power: number; rank: number; trophies: number; highestTrophies: number }>;
  updatedAt?: string;
};

const roleLabels: Record<string, string> = {
  Assassin: "Assassino",
  Artillery: "Artigliere",
  Controller: "Controllore",
  "Damage Dealer": "Assaltatore",
  Marksman: "Tiratore scelto",
  Support: "Supporto",
  Tank: "Tank",
  Unknown: "Ruolo speciale",
};

const rarityLabels: Record<string, string> = {
  "Starting Brawler": "Brawler iniziale",
  "Trophy Road": "Via dei trofei",
  Rare: "Raro",
  "Super Rare": "Super raro",
  Epic: "Epico",
  Mythic: "Mitico",
  Legendary: "Leggendario",
  "Ultra Legendary": "Ultra leggendario",
  Chromatic: "Cromatico",
  Unknown: "Rarità speciale",
};

function italianRole(role: string) {
  return roleLabels[role] || role;
}

function italianRarity(rarity: string) {
  return rarityLabels[rarity] || rarity;
}

function italianBrawlerDescription(name: string, role: string) {
  const descriptions: Record<string, string> = {
    Assassin: `${name} è un assassino rapido: cerca il momento giusto per avvicinarsi, eliminare il bersaglio e allontanarsi prima della risposta nemica.`,
    Artillery: `${name} è un artigliere che colpisce oltre gli ostacoli e controlla intere zone della mappa mantenendosi a distanza.`,
    Controller: `${name} è specializzato nel controllo: limita i movimenti avversari e crea spazio utile per tutta la squadra.`,
    "Damage Dealer": `${name} è un assaltatore capace di infliggere molti danni. Rende al meglio quando trova la distanza corretta per i suoi colpi.`,
    Marksman: `${name} è un tiratore scelto: premia precisione, distanza e scelta attenta del bersaglio.`,
    Support: `${name} è un brawler di supporto che potenzia o protegge gli alleati e rende il team più resistente.`,
    Tank: `${name} è un tank resistente, ideale per avanzare, assorbire danni e conquistare gli spazi più importanti.`,
    Unknown: `${name} possiede uno stile speciale che combina più ruoli. Studia attacco, Super e gadget per sfruttarlo al meglio.`,
  };
  return descriptions[role] || descriptions.Unknown;
}

const fallbackBrawlers: Brawler[] = [
  { id: 16000000, name: "Shelly", role: "Damage Dealer", rarity: "Starting Brawler", image: "https://cdn.brawlify.com/brawlers/borderless/16000000.png", color: "#8d5cff", power: 88, control: 66, survival: 72, mobility: 62 },
  { id: 16000005, name: "Spike", role: "Damage Dealer", rarity: "Legendary", image: "https://cdn.brawlify.com/brawlers/borderless/16000005.png", color: "#ffd92f", power: 91, control: 92, survival: 42, mobility: 58 },
  { id: 16000023, name: "Leon", role: "Assassin", rarity: "Legendary", image: "https://cdn.brawlify.com/brawlers/borderless/16000023.png", color: "#55df70", power: 85, control: 53, survival: 48, mobility: 96 },
  { id: 16000012, name: "Crow", role: "Assassin", rarity: "Legendary", image: "https://cdn.brawlify.com/brawlers/borderless/16000012.png", color: "#6f71e9", power: 76, control: 82, survival: 43, mobility: 94 },
  { id: 16000011, name: "Mortis", role: "Assassin", rarity: "Mythic", image: "https://cdn.brawlify.com/brawlers/borderless/16000011.png", color: "#a45cff", power: 79, control: 47, survival: 65, mobility: 99 },
  { id: 16000043, name: "Edgar", role: "Assassin", rarity: "Epic", image: "https://cdn.brawlify.com/brawlers/borderless/16000043.png", color: "#e756ff", power: 86, control: 38, survival: 72, mobility: 95 },
  { id: 16000001, name: "Colt", role: "Damage Dealer", rarity: "Rare", image: "https://cdn.brawlify.com/brawlers/borderless/16000001.png", color: "#ff5454", power: 96, control: 42, survival: 35, mobility: 72 },
  { id: 16000006, name: "Barley", role: "Artillery", rarity: "Rare", image: "https://cdn.brawlify.com/brawlers/borderless/16000006.png", color: "#52a8ff", power: 68, control: 96, survival: 38, mobility: 52 },
  { id: 16000013, name: "Poco", role: "Support", rarity: "Rare", image: "https://cdn.brawlify.com/brawlers/borderless/16000013.png", color: "#58e6a0", power: 51, control: 71, survival: 78, mobility: 63 },
];

const modes = [
  {
    name: "Gem Grab",
    map: "Hard Rock Mine",
    icon: "💎",
    color: "#9b54ff",
    brief: "Controlla il centro e proteggi chi raccoglie le gemme.",
    focus: ["control", "survival", "power"] as const,
  },
  {
    name: "Brawl Ball",
    map: "Super Beach",
    icon: "⚽",
    color: "#52e475",
    brief: "Servono pressione, movimento e capacità di aprire la difesa.",
    focus: ["mobility", "power", "survival"] as const,
  },
  {
    name: "Knockout",
    map: "Goldarm Gulch",
    icon: "🎯",
    color: "#ff6a54",
    brief: "Ogni eliminazione conta: gittata, burst e sopravvivenza.",
    focus: ["power", "survival", "control"] as const,
  },
];

function cleanAbility(ability: Ability, kind: "gadget" | "starPower"): Ability {
  return {
    ...ability,
    imageUrl: ability.imageUrl.replace("/borderless/", "/regular/"),
    description: kind === "gadget"
      ? `${ability.name} è un gadget attivo: usalo nel momento giusto per ottenere un vantaggio immediato durante lo scontro.`
      : `${ability.name} è un'abilità stellare passiva che migliora lo stile di gioco del brawler per tutta la partita.`,
  };
}

export default function Home() {
  const [catalog, setCatalog] = useState<Brawler[]>(fallbackBrawlers);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [query, setQuery] = useState("");
  const [openBrawler, setOpenBrawler] = useState<Brawler | null>(null);
  const [team, setTeam] = useState<number[]>([]);
  const [modeIndex, setModeIndex] = useState(0);
  const [result, setResult] = useState<null | { score: number; title: string; note: string }>(null);
  const [filter, setFilter] = useState("Tutti");
  const [xp, setXp] = useState(2450);
  const [wins, setWins] = useState(7);
  const [activeNav, setActiveNav] = useState("play");
  const [suggestions, setSuggestions] = useState<Array<{ team: Brawler[]; score: number }>>([]);
  const [viewedIds, setViewedIds] = useState<number[]>([]);
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [playerTag, setPlayerTag] = useState("");
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("brawllab-v2");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      queueMicrotask(() => {
        setXp(data.xp ?? 2450);
        setWins(data.wins ?? 7);
        setClaimedMissions(data.claimedMissions ?? []);
      });
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("brawllab-v2", JSON.stringify({ xp, wins, claimedMissions }));
  }, [xp, wins, claimedMissions]);

  useEffect(() => {
    const savedTag = localStorage.getItem("brawllab-player-tag") || "";
    setPlayerTag(savedTag);
    setTagDraft(savedTag);
  }, []);

  function savePlayerTag() {
    const normalized = `#${tagDraft.toUpperCase().replace(/[^0289PYLQGRJCUV]/g, "")}`;
    if (normalized.length < 4) return;
    localStorage.setItem("brawllab-player-tag", normalized);
    setPlayerTag(normalized);
    setTagDraft(normalized);
    setPlayer({ status: "pending", tag: normalized });
  }

  useEffect(() => {
    let active = true;
    fetch("https://api.brawlapi.com/v1/brawlers")
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((payload: { list: ApiBrawler[] }) => {
        if (!active) return;
        const normalized = payload.list
          .filter((item) => item.name && item.imageUrl2)
          .map((item, index) => {
            const role = item.class?.name || "Unknown";
            const roleBase: Record<string, [number, number, number, number]> = {
              Assassin: [83, 49, 51, 94],
              Artillery: [72, 92, 39, 48],
              Controller: [66, 92, 58, 60],
              "Damage Dealer": [90, 60, 59, 65],
              "Marksman": [91, 63, 42, 58],
              Support: [58, 78, 82, 68],
              Tank: [76, 62, 95, 48],
            };
            const base = roleBase[role] ?? [70, 70, 70, 70];
            const variation = (item.id + index * 7) % 11 - 5;
            const apiColor = /^#[0-9a-f]{6}$/i.test(item.rarity?.color || "") ? item.rarity.color : "#5c8dff";
            return {
              id: item.id,
              name: item.name,
              role,
              rarity: item.rarity?.name || "Unknown",
              image: item.imageUrl2,
              color: apiColor,
              power: Math.max(30, Math.min(99, base[0] + variation)),
              control: Math.max(30, Math.min(99, base[1] - variation)),
              survival: Math.max(30, Math.min(99, base[2] + Math.round(variation / 2))),
              mobility: Math.max(30, Math.min(99, base[3] - Math.round(variation / 2))),
              description: italianBrawlerDescription(item.name, role),
              gadgets: (item.gadgets || []).map((ability) => cleanAbility(ability, "gadget")),
              starPowers: (item.starPowers || []).map((ability) => cleanAbility(ability, "starPower")),
            };
          });
        setCatalog(normalized);
        setCatalogLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCatalogError(true);
        setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!openBrawler) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenBrawler(null);
    };
    document.addEventListener("keydown", close);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("modal-open");
    };
  }, [openBrawler]);

  const mode = modes[modeIndex];
  const selected = catalog.filter((brawler) => team.includes(brawler.id));
  const visible = catalog.filter((brawler) => {
    const roleMatch = filter === "Tutti" || brawler.role === filter;
    const queryMatch = brawler.name.toLowerCase().includes(query.trim().toLowerCase());
    return roleMatch && queryMatch;
  });

  const stats = useMemo(() => {
    const empty = { power: 0, control: 0, survival: 0, mobility: 0 };
    if (!selected.length) return empty;
    return (Object.keys(empty) as Array<keyof typeof empty>).reduce((acc, key) => {
      acc[key] = Math.round(selected.reduce((total, brawler) => total + brawler[key], 0) / selected.length);
      return acc;
    }, empty);
  }, [selected]);

  function toggleBrawler(id: number) {
    setResult(null);
    setTeam((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }

  function playStinger(kind: "pick" | "win" | "mission" = "pick") {
    if (!soundOn) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const notes = kind === "win" ? [392, 523, 659, 784] : kind === "mission" ? [523, 659, 784] : [330, 440];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "win" ? "square" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.08 + 0.13);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + index * 0.08 + 0.15);
    });
    window.setTimeout(() => context.close(), 700);
  }

  function scrollToSection(section: "play" | "brawlers" | "missions" | "profile") {
    setActiveNav(section);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openSheet(brawler: Brawler) {
    setOpenBrawler(brawler);
    setViewedIds((current) => current.includes(brawler.id) ? current : [...current, brawler.id]);
  }

  function addFromSheet(brawler: Brawler) {
    if (!team.includes(brawler.id) && team.length < 3) {
      setTeam((current) => [...current, brawler.id]);
      setResult(null);
      playStinger();
    }
    setOpenBrawler(null);
    window.setTimeout(() => scrollToSection("brawlers"), 60);
  }

  function teamScore(group: Brawler[]) {
    const averages = mode.focus.map((key) => group.reduce((sum, item) => sum + item[key], 0) / group.length);
    const diversity = new Set(group.map((item) => item.role)).size;
    return Math.min(99, Math.round((averages.reduce((sum, value) => sum + value, 0) / averages.length) * 0.9 + diversity * 4));
  }

  function suggestTeams() {
    const candidates = [...catalog]
      .sort((a, b) => mode.focus.reduce((sum, key) => sum + b[key] - a[key], 0))
      .slice(0, 28);
    const best: Array<{ team: Brawler[]; score: number }> = [];
    for (let a = 0; a < candidates.length - 2; a += 1) {
      for (let b = a + 1; b < candidates.length - 1; b += 1) {
        for (let c = b + 1; c < candidates.length; c += 1) {
          const group = [candidates[a], candidates[b], candidates[c]];
          best.push({ team: group, score: teamScore(group) });
        }
      }
    }
    setSuggestions(best.sort((a, b) => b.score - a.score).slice(0, 3));
    playStinger("win");
  }

  function applySuggestion(group: Brawler[]) {
    setTeam(group.map((item) => item.id));
    setResult(null);
    playStinger();
    scrollToSection("play");
  }

  function analyse() {
    if (selected.length !== 3) return;
    const focus = mode.focus.reduce((sum, key) => sum + stats[key], 0) / mode.focus.length;
    const diversity = new Set(selected.map((item) => item.role)).size;
    const score = Math.min(99, Math.round(focus * 0.9 + diversity * 4));
    const title = score >= 84 ? "TEAM DA STAR PLAYER!" : score >= 72 ? "BEL TEAM!" : "PUOI FARE MEGLIO";
    const weakest = (Object.entries(stats) as Array<[keyof typeof stats, number]>).sort((a, b) => a[1] - b[1])[0][0];
    const labels = { power: "potenza", control: "controllo", survival: "resistenza", mobility: "mobilità" };
    setResult({ score, title, note: `Il punto da migliorare è la ${labels[weakest]}. Prova a cambiare un brawler.` });
    playStinger(score >= 72 ? "win" : "pick");
    if (!result) {
      setXp((value) => value + 50);
      if (score >= 72) setWins((value) => value + 1);
    }
  }

  function switchMode(index: number) {
    setModeIndex(index);
    setTeam([]);
    setResult(null);
  }

  const roles = ["Tutti", ...Array.from(new Set(catalog.map((brawler) => brawler.role))).sort()];
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = xp % 500;
  const missionData = [
    { id: "stratega", title: "STRATEGA", text: "Analizza un team completo", progress: result ? 1 : 0, total: 1, reward: 80 },
    { id: "esploratore", title: "ESPLORATORE", text: "Apri 3 schede brawler", progress: Math.min(3, viewedIds.length), total: 3, reward: 60 },
    { id: "mix", title: "MIX PERFETTO", text: "Crea un team con 3 ruoli diversi", progress: selected.length === 3 && new Set(selected.map((item) => item.role)).size === 3 ? 1 : 0, total: 1, reward: 100 },
  ];

  function claimMission(id: string, reward: number) {
    if (claimedMissions.includes(id)) return;
    setClaimedMissions((current) => [...current, id]);
    setXp((current) => current + reward);
    playStinger("mission");
  }

  return (
    <main className="brawl-app">
      <header className="game-header">
        <button className="logo" aria-label="BrawlLab home">
          <span className="logo-star">★</span>
          <span>BRAWL<strong>LAB</strong></span>
        </button>
        <nav>
          <button className={activeNav === "play" ? "active" : ""} onClick={() => scrollToSection("play")}>PLAY</button>
          <button className={activeNav === "brawlers" ? "active" : ""} onClick={() => scrollToSection("brawlers")}>BRAWLERS</button>
          <button className={activeNav === "missions" ? "active" : ""} onClick={() => scrollToSection("missions")}>MISSIONS</button>
        </nav>
        <div className="account">
          <button className="sound-toggle" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Disattiva suoni" : "Attiva suoni"}>{soundOn ? "🔊" : "🔇"}</button>
          <div className="currency"><span>⚡</span><strong>{xp}</strong></div>
          <div className="player-badge"><span>12</span><div><strong>PLAYER ONE</strong><small>Livello {level}</small></div></div>
        </div>
      </header>

      <section className="hero-arena">
        <div className="hero-copy">
          <span className="season-label">BRAWL LAB · SEASON 1</span>
          <h1>BUILD YOUR<br /><em>DREAM TEAM</em></h1>
          <p>Scegli tre brawler reali. Scopri se la tua squadra può dominare la modalità del giorno.</p>
          <button className="profile-jump" onClick={() => scrollToSection("profile")}>👤 APRI IL MIO PROFILO</button>
          <div className="xp-row">
            <div><span>LEVEL {level}</span><strong>{levelProgress}/500 XP</strong></div>
            <div className="xp-track"><i style={{ width: `${(levelProgress / 500) * 100}%` }} /></div>
            <span className="win-streak">🔥 {wins} WIN</span>
          </div>
        </div>
        <div className="hero-brawlers" aria-label="Brawler in evidenza">
          <div className="sunburst" />
          <img className="hero-leon" src="https://cdn.brawlify.com/brawlers/borderless/16000023.png" alt="Leon" />
          <img className="hero-spike" src="https://cdn.brawlify.com/brawlers/borderless/16000005.png" alt="Spike" />
          <div className="sticker sticker-one">POW!</div>
          <div className="sticker sticker-two">★</div>
        </div>
      </section>

      <section className="mode-strip">
        <span className="mode-title">CHOOSE EVENT</span>
        <div className="mode-buttons">
          {modes.map((item, index) => (
            <button key={item.name} className={modeIndex === index ? "selected" : ""} onClick={() => switchMode(index)} style={{ "--mode-color": item.color } as React.CSSProperties}>
              <span>{item.icon}</span>
              <div><strong>{item.name}</strong><small>{item.map}</small></div>
              {modeIndex === index && <i>SELECTED</i>}
            </button>
          ))}
        </div>
      </section>

      <section className="builder-wrap" id="play">
        <article className="battle-card" style={{ "--event-color": mode.color } as React.CSSProperties}>
          <div className="battle-card-head">
            <div className="event-icon">{mode.icon}</div>
            <div><span>DAILY CHALLENGE · +50 XP</span><h2>{mode.name}</h2><p>{mode.map}</p></div>
            <b>NEW EVENT</b>
          </div>
          <p className="brief"><strong>COACH:</strong> {mode.brief}</p>
          <div className="team-stage">
            {[0, 1, 2].map((slot) => {
              const brawler = selected[slot];
              return (
                <button key={slot} className={`team-slot ${brawler ? "has-brawler" : ""}`} onClick={() => brawler && toggleBrawler(brawler.id)}>
                  {brawler ? (
                    <>
                      <img src={brawler.image} alt={brawler.name} />
              <div><strong>{brawler.name}</strong><span>{italianRole(brawler.role)}</span></div>
                      <i>×</i>
                    </>
                  ) : (
                    <>
                      <span className="plus">+</span>
                      <strong>PICK BRAWLER</strong>
                      <small>Slot {slot + 1}</small>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          {result && (
            <div className="score-result">
              <div className="score-burst"><strong>{result.score}</strong><small>SCORE</small></div>
              <div><strong>{result.title}</strong><p>{result.note}</p></div>
            </div>
          )}
          <div className="builder-actions">
            <button className="suggest-button" onClick={suggestTeams}>💡 SUGGERISCI TEAM</button>
            <button className="fight-button" disabled={selected.length !== 3} onClick={analyse}>
              <span>★</span> ANALYSE TEAM <b>→</b>
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="suggestion-panel">
              <div className="suggestion-title"><strong>TOP TEAM PER {mode.name.toUpperCase()}</strong><button onClick={() => setSuggestions([])}>×</button></div>
              {suggestions.map((suggestion, index) => (
                <article key={suggestion.team.map((item) => item.id).join("-")}>
                  <b>#{index + 1}</b>
                  <div className="suggestion-faces">{suggestion.team.map((item) => <img key={item.id} src={item.image} alt={item.name} title={item.name} />)}</div>
                  <span>{suggestion.team.map((item) => item.name).join(" · ")}</span>
                  <strong>{suggestion.score}</strong>
                  <button onClick={() => applySuggestion(suggestion.team)}>USA TEAM</button>
                </article>
              ))}
            </div>
          )}
        </article>

        <aside className="team-power">
          <div className="power-head"><span>TEAM STATS</span><strong>{selected.length}/3</strong></div>
          {([
            ["ATTACK", "power", "#ff4f65"],
            ["CONTROL", "control", "#a05bff"],
            ["SURVIVAL", "survival", "#55df70"],
            ["MOBILITY", "mobility", "#42c9ff"],
          ] as const).map(([label, key, color]) => (
            <div className="power-stat" key={key}>
              <div><span>{label}</span><strong>{stats[key]}</strong></div>
              <div><i style={{ width: `${stats[key]}%`, background: color }} /></div>
            </div>
          ))}
          <div className="coach-box">
            <span>💡</span>
            <p><strong>PRO TIP</strong>Un team con ruoli diversi riceve un bonus sinergia.</p>
          </div>
        </aside>
      </section>

      <section className="roster-section" id="brawlers">
        <div className="roster-head">
          <div>
            <span>ENCICLOPEDIA BRAWLER · {catalog.length} PERSONAGGI</span>
            <h2>TUTTI I BRAWLER</h2>
            <p>Clicca una scheda per scoprire abilità, gadget e Hypercharge.</p>
          </div>
          <label className="brawler-search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca brawler..." aria-label="Cerca brawler" />
          </label>
          <div className="role-filter">
            {roles.map((role) => <button key={role} className={role === filter ? "active" : ""} onClick={() => setFilter(role)}>{role === "Tutti" ? role : italianRole(role)}</button>)}
          </div>
        </div>
        {catalogLoading && <div className="catalog-status"><span className="loader-star">★</span><strong>Caricamento del Brawler Codex…</strong></div>}
        {catalogError && <div className="catalog-warning">Catalogo online non disponibile: sto mostrando i brawler salvati nell’app.</div>}
        <div className="brawler-grid">
          {visible.map((brawler) => (
            <article
              key={brawler.id}
              className={`brawler-card ${team.includes(brawler.id) ? "picked" : ""}`}
              onClick={() => openSheet(brawler)}
              onKeyDown={(event) => event.key === "Enter" && openSheet(brawler)}
              role="button"
              tabIndex={0}
              style={{ "--brawler-color": brawler.color } as React.CSSProperties}
            >
              <span className="rarity">{italianRarity(brawler.rarity)}</span>
              <div className="portrait"><div className="rays" /><img src={brawler.image} alt={brawler.name} /></div>
              <div className="nameplate">
                <strong>{brawler.name}</strong>
                <span>{italianRole(brawler.role)}</span>
                <small>APRI SCHEDA →</small>
              </div>
              <button
                className="quick-add"
                aria-label={`${team.includes(brawler.id) ? "Rimuovi" : "Aggiungi"} ${brawler.name} ${team.includes(brawler.id) ? "dal" : "al"} team`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleBrawler(brawler.id);
                }}
              >
                {team.includes(brawler.id) ? "✓" : "+"}
              </button>
            </article>
          ))}
        </div>
        {!catalogLoading && visible.length === 0 && <div className="empty-search">Nessun brawler trovato. Prova un altro nome.</div>}
      </section>

      <section className="player-section" id="profile">
        <div className="player-panel">
          <div className="player-panel-head">
            <div><span>PROFILO BRAWL STARS</span><h2>{player?.name || "IL MIO PROFILO"}</h2><p>{playerTag ? <>Tag salvato sul dispositivo: <strong>{playerTag}</strong></> : "Collega il tuo tag giocatore"}</p></div>
            <div className="player-avatar">★</div>
          </div>
          {!playerTag ? (
            <div className="profile-connect">
              <label><span>TAG GIOCATORE</span><input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="#XXXXXXXX" aria-label="Tag giocatore Brawl Stars" /></label>
              <button onClick={savePlayerTag}>SALVA SUL TELEFONO</button>
              <p>Il tag resta esclusivamente in questo browser e non viene pubblicato online.</p>
            </div>
          ) : player?.status === "ready" || player?.trophies !== undefined ? (
            <>
              <div className="profile-stats">
                <article><span>🏆</span><strong>{player.trophies?.toLocaleString("it-IT")}</strong><small>COPPE ATTUALI</small></article>
                <article><span>👑</span><strong>{player.highestTrophies?.toLocaleString("it-IT")}</strong><small>RECORD COPPE</small></article>
                <article><span>⚡</span><strong>{player.expLevel}</strong><small>LIVELLO ESPERIENZA</small></article>
                <article><span>3V3</span><strong>{player["3vs3Victories"]?.toLocaleString("it-IT")}</strong><small>VITTORIE</small></article>
              </div>
              <div className="profile-extra">
                <span>🎮 Solo: <strong>{player.soloVictories || 0}</strong></span>
                <span>🤝 Duo: <strong>{player.duoVictories || 0}</strong></span>
                <span>🛡️ Club: <strong>{player.club?.name || "Nessun club"}</strong></span>
                <span>⭐ Brawler sbloccati: <strong>{player.brawlers?.length || 0}</strong></span>
              </div>
            </>
          ) : (
            <div className="profile-pending"><span>🔗</span><div><strong>TAG SALVATO IN SICUREZZA</strong><p>Il profilo è predisposto. Il prossimo passaggio sarà il collegamento protetto con l’API ufficiale per mostrare coppe e progressi senza rendere pubblico il tag.</p></div></div>
          )}
        </div>
      </section>

      <section className="missions-section" id="missions">
        <div className="missions-head"><div><span>DAILY QUEST BOARD</span><h2>MISSIONS</h2></div><p>Completa gli obiettivi, riscuoti XP e sali di livello.</p></div>
        <div className="mission-grid">
          {missionData.map((mission) => {
            const complete = mission.progress >= mission.total;
            const claimed = claimedMissions.includes(mission.id);
            return (
              <article className={complete ? "complete" : ""} key={mission.id}>
                <div className="mission-icon">{claimed ? "✓" : mission.id === "stratega" ? "🎯" : mission.id === "esploratore" ? "🔎" : "★"}</div>
                <div><span>+{mission.reward} XP</span><h3>{mission.title}</h3><p>{mission.text}</p></div>
                <div className="mission-progress"><i style={{ width: `${(mission.progress / mission.total) * 100}%` }} /></div>
                <small>{mission.progress}/{mission.total}</small>
                <button disabled={!complete || claimed} onClick={() => claimMission(mission.id, mission.reward)}>{claimed ? "RISCOSSA" : complete ? "RISCUOTI" : "IN CORSO"}</button>
              </article>
            );
          })}
        </div>
      </section>

      {openBrawler && (
        <div className="brawler-modal" role="dialog" aria-modal="true" aria-labelledby="brawler-title" onMouseDown={(event) => event.target === event.currentTarget && setOpenBrawler(null)}>
          <article className="brawler-sheet" style={{ "--sheet-color": openBrawler.color } as React.CSSProperties}>
            <button className="sheet-close" onClick={() => setOpenBrawler(null)} aria-label="Chiudi scheda">×</button>
            <div className="sheet-hero">
              <div className="sheet-rays" />
              <div className="motion-lines"><i /><i /><i /></div>
              <img
                src={`https://cdn.brawlify.com/brawlers/model/${openBrawler.id}.png`}
                alt={`${openBrawler.name} a figura intera`}
                onError={(event) => { event.currentTarget.src = openBrawler.image; }}
              />
              <div className="sheet-identity">
                <span>{italianRarity(openBrawler.rarity)} · {italianRole(openBrawler.role)}</span>
                <h2 id="brawler-title">{openBrawler.name}</h2>
                <p>{openBrawler.description || italianBrawlerDescription(openBrawler.name, openBrawler.role)}</p>
              </div>
            </div>

            <div className="ability-showcase">
              <article className="ability-card attack-card">
                <div className="ability-visual attack-motion"><span>●</span><i /><i /><i /></div>
                <div><span>ATTACCO</span><strong>Attacco principale</strong><p>Il colpo base di {openBrawler.name}, progettato per il suo stile da {italianRole(openBrawler.role).toLowerCase()}.</p></div>
              </article>
              <article className="ability-card super-card">
                <div className="ability-visual super-motion"><span>★</span><i /></div>
                <div><span>SUPER</span><strong>Mossa speciale</strong><p>La Super cambia il ritmo dello scontro quando la barra è completamente carica.</p></div>
              </article>
              <article className="ability-card hyper-card">
                <div className="ability-visual hyper-motion"><span>⬡</span><i /><b /></div>
                <div><span>HYPERCHARGE</span><strong>Modalità potenziata</strong><p>Aura Hypercharge: pressione, velocità e impatto visivo al massimo.</p></div>
              </article>
            </div>

            <div className="sheet-loadout">
              <section>
                <div className="loadout-title"><span className="green-dot">●</span><div><strong>GADGET</strong><small>Abilità attive</small></div></div>
                <div className="loadout-grid">
                  {(openBrawler.gadgets || []).map((gadget) => (
                    <article className="loadout-item gadget-item" key={gadget.id}>
                      <img src={gadget.imageUrl} alt="" />
                      <div><strong>{gadget.name}</strong><p>{gadget.description}</p></div>
                    </article>
                  ))}
                  {!openBrawler.gadgets?.length && <p className="missing-ability">Gadget in aggiornamento.</p>}
                </div>
              </section>
              <section>
                <div className="loadout-title"><span className="yellow-dot">★</span><div><strong>STAR POWER</strong><small>Abilità passive</small></div></div>
                <div className="loadout-grid">
                  {(openBrawler.starPowers || []).map((power) => (
                    <article className="loadout-item star-item" key={power.id}>
                      <img src={power.imageUrl} alt="" />
                      <div><strong>{power.name}</strong><p>{power.description}</p></div>
                    </article>
                  ))}
                  {!openBrawler.starPowers?.length && <p className="missing-ability">Star Power in aggiornamento.</p>}
                </div>
              </section>
            </div>

            <div className="sheet-actions">
              <div className="mini-stats">
                <span>ATK <b>{openBrawler.power}</b></span>
                <span>CTRL <b>{openBrawler.control}</b></span>
                <span>SURV <b>{openBrawler.survival}</b></span>
                <span>MOB <b>{openBrawler.mobility}</b></span>
              </div>
              <button onClick={() => addFromSheet(openBrawler)}>
                {team.includes(openBrawler.id) ? "← TORNA AI BRAWLERS" : "+ AGGIUNGI AL TEAM"}
              </button>
            </div>
          </article>
        </div>
      )}

      <footer>
        <strong>BRAWL<span>LAB</span></strong>
        <p>Fan companion non ufficiale. Questo materiale non è ufficiale e non è approvato da Supercell. Immagini e nomi appartengono ai rispettivi titolari. Dati del catalogo forniti da BrawlAPI/Brawlify.</p>
        <a href="https://supercell.com/en/fan-content-policy/" target="_blank" rel="noreferrer">FAN CONTENT POLICY ↗</a>
      </footer>
    </main>
  );
}
