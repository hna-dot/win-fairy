"use client";

import { TEAMS } from "@/lib/data/teams";

interface Props {
  selectedTeamId: string | null;
  onSelect: (teamId: string) => void;
}

export default function TeamSelector({ selectedTeamId, onSelect }: Props) {
  return (
    <div id="team-scroll" className="no-scrollbar flex gap-[11px] overflow-x-auto px-[22px] py-[18px]">
      {TEAMS.map((team) => {
        const selected = team.id === selectedTeamId;
        return (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelect(team.id)}
            className="flex w-[52px] shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full p-2 transition"
              style={{
                background: team.colorMain,
                border: selected ? "2px solid var(--gold)" : "2px solid transparent",
                boxShadow: selected ? "0 0 0 3px rgba(201,162,39,0.25)" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 SVG 아이콘, next/image 최적화 대상 아님 */}
              <img src={`/team-logos/${team.id}.svg`} alt={team.fullName} className="h-full w-full object-contain" />
            </span>
            <span className={`text-[9px] ${selected ? "font-bold text-ink" : "text-[#5c563f]"}`}>{team.id}</span>
          </button>
        );
      })}
    </div>
  );
}
