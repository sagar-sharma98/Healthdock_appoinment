import React from 'react';
import { Building2, Video } from 'lucide-react';

export default function ConsultationModeCard({
  inPerson = 0,
  video = 0,
  inPersonPercent = 0,
  videoPercent = 0,
}) {
  const total = inPerson + video;

  return (
    <div className="space-y-4">
      {/* Segmented Visual Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex p-0.5 gap-1">
        {total === 0 ? (
          <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" />
        ) : (
          <>
            <div
              style={{ width: `${inPersonPercent}%` }}
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              title={`In-Person: ${inPerson} (${inPersonPercent}%)`}
            />
            <div
              style={{ width: `${videoPercent}%` }}
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              title={`Video: ${video} (${videoPercent}%)`}
            />
          </>
        )}
      </div>

      {/* Breakdown Legend Items */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* In-Person */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                In-Person OPD
              </span>
              <span className="text-sm font-bold font-serif text-slate-900 dark:text-white">
                {inPerson}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 font-mono">
            {total > 0 ? `${inPersonPercent}%` : '0%'}
          </span>
        </div>

        {/* Video Teleconsult */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Online Video
              </span>
              <span className="text-sm font-bold font-serif text-slate-900 dark:text-white">
                {video}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 font-mono">
            {total > 0 ? `${videoPercent}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
}
